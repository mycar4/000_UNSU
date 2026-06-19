-- ==========================================
-- UNSU PLATFORM DATABASE SCHEMA (v1.0)
-- Target RDBMS: PostgreSQL 15+ (Supabase compatible)
-- Single Source of Truth for Database Engine
-- ==========================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. DOMAIN: Drivers & Onboarding
-- ==========================================

CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Linked with auth.users(id) in Supabase
    birth_date DATE NOT NULL,
    birth_time TIME NOT NULL,
    business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('PRIVATE', 'PREMIUM')),
    hometax_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for auto updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 2. DOMAIN: 오늘의 루틴 (GILLOG)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.daily_lucky_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    lucky_date DATE NOT NULL,
    fortune_grade VARCHAR(20) NOT NULL CHECK (fortune_grade IN ('BEST', 'GOOD', 'NORMAL', 'BAD')),
    fortune_comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_driver_lucky_date UNIQUE (driver_id, lucky_date)
);

CREATE TABLE IF NOT EXISTS public.recommended_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    destination_name VARCHAR(100) NOT NULL,
    route_summary TEXT NOT NULL,
    tmap_intent_url TEXT NOT NULL,
    tmap_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 3. DOMAIN: G-PAN 레이더 (실시간 관제)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.hot_zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('HIGH', 'NORMAL', 'LOW')),
    wait_minutes INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_hot_zones_updated_at
    BEFORE UPDATE ON public.hot_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.audio_broadcast_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    broadcast_text TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 4. DOMAIN: 로드보더 (리더보드 & 커뮤니티)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.revenue_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_date DATE NOT NULL,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    driver_name_masked VARCHAR(50) NOT NULL,
    total_revenue INTEGER NOT NULL CHECK (total_revenue >= 0),
    route_summary VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_date_driver_revenue UNIQUE (target_date, driver_id)
);

CREATE TABLE IF NOT EXISTS public.plaza_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    author_name VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id UUID NOT NULL REFERENCES public.plaza_posts(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (post_id, driver_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.plaza_posts(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    author_name VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 5. DOMAIN: 오토파일럿 (경영/정산)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    record_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_revenue INTEGER DEFAULT 0 NOT NULL CHECK (total_revenue >= 0),
    fixed_expense INTEGER DEFAULT 0 NOT NULL CHECK (fixed_expense >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_driver_month UNIQUE (driver_id, record_month)
);

CREATE TRIGGER update_financial_records_updated_at
    BEFORE UPDATE ON public.financial_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.tax_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    estimated_refund_amount INTEGER DEFAULT 0 NOT NULL CHECK (estimated_refund_amount >= 0),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 6. PERFORMANCE TUNING & INDEXES
-- ==========================================

-- Index for searching drivers by date of birth (sa-ju lookup optimization)
CREATE INDEX IF NOT EXISTS idx_drivers_birth_date ON public.drivers(birth_date);

-- Index for leaderboard date-based sorting
CREATE INDEX IF NOT EXISTS idx_leaderboards_date_revenue ON public.revenue_leaderboards(target_date, total_revenue DESC);

-- Index for temporal daily updates on GILLOG
CREATE INDEX IF NOT EXISTS idx_daily_lucky_date ON public.daily_lucky_cards(lucky_date);
CREATE INDEX IF NOT EXISTS idx_recommended_date ON public.recommended_courses(target_date);

-- Spatial index mock (latitude and longitude indexes for GPAN range query)
CREATE INDEX IF NOT EXISTS idx_hotzones_coordinates ON public.hot_zones(latitude, longitude);


-- ==========================================
-- 7. SECURITY & ACCESS CONTROL (Supabase RLS)
-- ==========================================

-- Enable Row Level Security
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_lucky_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommended_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_broadcast_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaza_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_refunds ENABLE ROW LEVEL SECURITY;

-- Drivers policies (Owner access only)
CREATE POLICY "Drivers can view their own profile" ON public.drivers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Drivers can update their own profile" ON public.drivers
    FOR UPDATE USING (auth.uid() = id);

-- Personal Routines & Tax policies (Owner access only)
CREATE POLICY "Drivers can view their own lucky cards" ON public.daily_lucky_cards
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their own recommended courses" ON public.recommended_courses
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their own financial records" ON public.financial_records
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their own tax refunds" ON public.tax_refunds
    FOR SELECT USING (auth.uid() = driver_id);

-- Global Shared Read, Restricted Write policies
CREATE POLICY "Authenticated users can view leaderboard" ON public.revenue_leaderboards
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view posts" ON public.plaza_posts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Drivers can insert their own posts" ON public.plaza_posts
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update or delete their own posts" ON public.plaza_posts
    FOR ALL USING (auth.uid() = driver_id);

-- Likes & Comments policies (Global read, restricted write)
CREATE POLICY "Authenticated users can view post likes" ON public.post_likes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Drivers can toggle their own likes" ON public.post_likes
    FOR ALL USING (auth.uid() = driver_id);

CREATE POLICY "Authenticated users can view comments" ON public.post_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Drivers can insert comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = driver_id);
