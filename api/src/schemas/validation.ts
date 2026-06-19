import { z } from 'zod'

export const UserQuerySchema = z.object({
  query: z.string()
    .min(2, { message: '검색어는 최소 2글자 이상' })
    .max(100, { message: '검색어는 최대 100글자까지' })
    .trim(),
})
