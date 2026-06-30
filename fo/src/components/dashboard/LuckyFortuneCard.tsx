import React, { useMemo } from 'react';
import { z } from 'zod';
import { SafeMarkdownRenderer } from '@/components/common/SafeMarkdownRenderer';

// 1. 컴플라이언스 락인: Zod 스키마를 통한 API 경계 방어
export const LuckyFortuneSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, '제목은 필수입니다.'),
  summary: z.string(),
  luckyScore: z.number().min(0).max(100),
  luckyItems: z.array(z.string()),
});

export type LuckyFortuneData = z.infer<typeof LuckyFortuneSchema>;

export interface LuckyFortuneCardProps {
  data: unknown; // 외부 API로부터 들어오는 불확실한 데이터 타입 방어
  onActionClick?: () => void;
}

export function LuckyFortuneCard({ data, onActionClick }: LuckyFortuneCardProps) {
  // 2. 비즈니스 로직 연동 (manse.ts 계산 결과 데이터 매핑 및 검증)
  const validatedData = useMemo(() => {
    const result = LuckyFortuneSchema.safeParse(data);
    if (!result.success) {
      console.error('Invalid fortune data provided:', result.error);
      return null;
    }
    return result.data;
  }, [data]);

  // 3. 파생 데이터 메모이제이션 (운세 등급 산출)
  const scoreLevel = useMemo(() => {
    if (!validatedData) return null;
    const score = validatedData.luckyScore;
    if (score >= 90) return { label: '대길 (大吉)', color: 'text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/50' };
    if (score >= 70) return { label: '중길 (中吉)', color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50' };
    if (score >= 50) return { label: '소길 (小吉)', color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50' };
    return { label: '평범 (平凡)', color: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800' };
  }, [validatedData]);

  if (!validatedData || !scoreLevel) {
    return (
      <div className="rounded-[16px] bg-white/70 backdrop-blur-md p-6 border border-slate-100/80 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-xl font-medium leading-relaxed text-red-500">
          데이터를 안전하게 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  return (
    <article className="group relative overflow-hidden rounded-[16px] bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-100/80 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]">
      {/* 프리미엄 질감을 위한 은은한 장식 그라데이션 */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-100/40 to-purple-100/40 dark:from-indigo-900/20 dark:to-purple-900/20 blur-3xl pointer-events-none transition-transform group-hover:scale-110" />
      
      <div className="relative p-6 sm:p-8 flex flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] dark:text-slate-100">
            {validatedData.title}
          </h2>
          <div className={`px-5 py-2.5 rounded-full text-xl font-bold tracking-tight ${scoreLevel.color}`}>
            {scoreLevel.label}
          </div>
        </header>

        {/* 4. 컴플라이언스 락인: SafeMarkdownRenderer를 통한 안전한 본문 렌더링 */}
        <div className="text-xl font-medium leading-relaxed text-[#334155] dark:text-slate-300">
          <SafeMarkdownRenderer content={validatedData.summary} />
        </div>

        {validatedData.luckyItems.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {validatedData.luckyItems.map((item, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[#334155] dark:text-slate-200 text-xl font-medium border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* 5. 오조작 방지: h-14 / 최소 p-6 클릭 요소 */}
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-[#0f172a] dark:bg-slate-100 text-white dark:text-slate-900 text-xl font-bold transition-all active:scale-[0.98] hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-400/30 p-6 shadow-md hover:shadow-lg"
            aria-label="상세 결과 확인하기"
          >
            상세 결과 확인하기
          </button>
        )}
      </div>
    </article>
  );
}
