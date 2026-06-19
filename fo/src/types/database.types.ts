export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: {
          id: string
          birth_date: string
          birth_time: string
          business_type: 'PRIVATE' | 'PREMIUM'
          hometax_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          birth_date: string
          birth_time: string
          business_type: 'PRIVATE' | 'PREMIUM'
          hometax_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          birth_date?: string
          birth_time?: string
          business_type?: 'PRIVATE' | 'PREMIUM'
          hometax_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      daily_lucky_cards: {
        Row: {
          id: string
          driver_id: string
          lucky_date: string
          fortune_grade: 'BEST' | 'GOOD' | 'NORMAL' | 'BAD'
          fortune_comment: string
          created_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          lucky_date: string
          fortune_grade: 'BEST' | 'GOOD' | 'NORMAL' | 'BAD'
          fortune_comment: string
          created_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          lucky_date?: string
          fortune_grade?: 'BEST' | 'GOOD' | 'NORMAL' | 'BAD'
          fortune_comment?: string
          created_at?: string
        }
      }
      recommended_courses: {
        Row: {
          id: string
          driver_id: string
          target_date: string
          destination_name: string
          route_summary: string
          tmap_intent_url: string
          tmap_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          target_date: string
          destination_name: string
          route_summary: string
          tmap_intent_url: string
          tmap_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          target_date?: string
          destination_name?: string
          route_summary?: string
          tmap_intent_url?: string
          tmap_sent_at?: string | null
          created_at?: string
        }
      }
      hot_zones: {
        Row: {
          id: number
          zone_name: string
          latitude: number
          longitude: number
          status: 'HIGH' | 'NORMAL' | 'LOW'
          wait_minutes: number
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          zone_name: string
          latitude: number
          longitude: number
          status: 'HIGH' | 'NORMAL' | 'LOW'
          wait_minutes?: number
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          zone_name?: string
          latitude?: number
          longitude?: number
          status?: 'HIGH' | 'NORMAL' | 'LOW'
          wait_minutes?: number
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      audio_broadcast_logs: {
        Row: {
          id: string
          driver_id: string
          broadcast_text: string
          sent_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          broadcast_text: string
          sent_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          broadcast_text?: string
          sent_at?: string
        }
      }
      revenue_leaderboards: {
        Row: {
          id: string
          target_date: string
          driver_id: string
          driver_name_masked: string
          total_revenue: number
          route_summary: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          target_date: string
          driver_id: string
          driver_name_masked: string
          total_revenue: number
          route_summary: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          target_date?: string
          driver_id?: string
          driver_name_masked?: string
          total_revenue?: number
          route_summary?: string
          verified?: boolean
          created_at?: string
        }
      }
      plaza_posts: {
        Row: {
          id: string
          driver_id: string
          author_name: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          author_name: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          author_name?: string
          content?: string
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          post_id: string
          driver_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          driver_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          driver_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          driver_id: string
          author_name: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          driver_id: string
          author_name: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          driver_id?: string
          author_name?: string
          content?: string
          created_at?: string
        }
      }
      financial_records: {
        Row: {
          id: string
          driver_id: string
          record_month: string
          total_revenue: number
          fixed_expense: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          record_month: string
          total_revenue?: number
          fixed_expense?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          record_month?: string
          total_revenue?: number
          fixed_expense?: number
          created_at?: string
          updated_at?: string
        }
      }
      tax_refunds: {
        Row: {
          id: string
          driver_id: string
          request_date: string
          status: 'PENDING' | 'SUCCESS' | 'FAILED'
          estimated_refund_amount: number
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          request_date: string
          status: 'PENDING' | 'SUCCESS' | 'FAILED'
          estimated_refund_amount?: number
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          request_date?: string
          status?: 'PENDING' | 'SUCCESS' | 'FAILED'
          estimated_refund_amount?: number
          processed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
