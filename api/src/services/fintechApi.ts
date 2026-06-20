import { z } from 'zod'

// ----------------------------------------------------
// 1. Zod Validation Schemas for Fintech Scraping
// ----------------------------------------------------

export const CardRevenueTransactionSchema = z.object({
  transaction_id: z.string(),
  approval_date: z.string(), // YYYY-MM-DD
  approval_time: z.string(), // HH:MM:SS
  card_company: z.string(),
  masked_card_number: z.string(),
  amount: z.number(),
  fee_amount: z.number(),
  settlement_estimated_date: z.string() // YYYY-MM-DD
})

export const BusinessExpenseTransactionSchema = z.object({
  expense_id: z.string(),
  purchase_date: z.string(), // YYYY-MM-DD
  merchant_name: z.string(),
  category: z.enum(['FUEL', 'MAINTENANCE', 'TIRE', 'TAX', 'INSURANCE', 'ETC']),
  amount: z.number(),
  tax_amount: z.number(),
  hometax_eligible: z.boolean() // If this expense is eligible for 10% VAT refund
})

export type CardRevenue = z.infer<typeof CardRevenueTransactionSchema>
export type BusinessExpense = z.infer<typeof BusinessExpenseTransactionSchema>

// ----------------------------------------------------
// 2. Fintech Scraping Adapter (CODEF / Kucon Broker mock)
// ----------------------------------------------------

const KUCON_API_BROKER_KEY = process.env.KUCON_API_BROKER_KEY || ''

/**
 * Scrapes daily card approval transactions from Credit Finance Association (여신금융협회)
 */
export async function scrapeDailyCardRevenues(hometaxId: string, date: string): Promise<CardRevenue[]> {
  try {
    if (KUCON_API_BROKER_KEY) {
      // Production API Scraping Call format using Kucon broker endpoint
      const response = await fetch('https://api.kucon.co.kr/v1/scrap/card/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KUCON_API_BROKER_KEY}`
        },
        body: JSON.stringify({ hometaxId, targetDate: date })
      })
      if (response.ok) {
        const rawData: any = await response.json()
        const rawList = rawData.data?.transactions || []
        return rawList.map((tx: any) => CardRevenueTransactionSchema.parse({
          transaction_id: tx.txId,
          approval_date: tx.apprDate,
          approval_time: tx.apprTime,
          card_company: tx.cardIssuer,
          masked_card_number: tx.cardNumber,
          amount: Number(tx.amount),
          fee_amount: Number(tx.fee),
          settlement_estimated_date: tx.settleDate
        }))
      }
    }
  } catch (err: any) {
    console.warn('[Fintech API] Scraping card revenues failed, falling back to Sandbox.', err.message)
  }

  // Sandbox fallback transactions
  return [
    {
      transaction_id: 'tx_982348',
      approval_date: date,
      approval_time: '14:22:10',
      card_company: '국민카드',
      masked_card_number: '4579-73**-****-****',
      amount: 54200,
      fee_amount: 813,
      settlement_estimated_date: getNextBusinessDay(date)
    },
    {
      transaction_id: 'tx_982349',
      approval_date: date,
      approval_time: '16:05:43',
      card_company: '신한카드',
      masked_card_number: '4902-12**-****-****',
      amount: 18700,
      fee_amount: 280,
      settlement_estimated_date: getNextBusinessDay(date)
    }
  ]
}

/**
 * Scrapes tax-deductible vehicle purchase/maintenance expenses from NTS (국세청 홈택스)
 */
export async function scrapeBusinessExpenses(hometaxId: string, month: string): Promise<BusinessExpense[]> {
  try {
    if (KUCON_API_BROKER_KEY) {
      // Production API Scraping Call format using CODEF/Kucon NTS scrapers
      const response = await fetch('https://api.kucon.co.kr/v1/scrap/nts/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KUCON_API_BROKER_KEY}`
        },
        body: JSON.stringify({ hometaxId, targetMonth: month })
      })
      if (response.ok) {
        const rawData: any = await response.json()
        const rawList = rawData.data?.expenses || []
        return rawList.map((ex: any) => BusinessExpenseTransactionSchema.parse({
          expense_id: ex.id,
          purchase_date: ex.date,
          merchant_name: ex.merchant,
          category: ex.category as any,
          amount: Number(ex.amount),
          tax_amount: Number(ex.tax),
          hometax_eligible: Boolean(ex.vatRefundable)
        }))
      }
    }
  } catch (err: any) {
    console.warn('[Fintech API] Scraping business expenses failed, falling back to Sandbox.', err.message)
  }

  // Sandbox fallback transactions for the given month (e.g. '2026-06')
  return [
    {
      expense_id: 'exp_5510',
      purchase_date: `${month}-05`,
      merchant_name: '오토큐 강남점',
      category: 'MAINTENANCE',
      amount: 245000,
      tax_amount: 24500,
      hometax_eligible: true
    },
    {
      expense_id: 'exp_5511',
      purchase_date: `${month}-12`,
      merchant_name: 'GS칼텍스 대박주유소',
      category: 'FUEL',
      amount: 85000,
      tax_amount: 8500,
      hometax_eligible: true
    },
    {
      expense_id: 'exp_5512',
      purchase_date: `${month}-18`,
      merchant_name: '한국타이어 직영점',
      category: 'TIRE',
      amount: 480000,
      tax_amount: 48000,
      hometax_eligible: true
    }
  ]
}

function getNextBusinessDay(dateStr: string): string {
  const d = new Date(dateStr)
  // Add 2 days for credit card settlement buffer
  d.setDate(d.getDate() + 2)
  return d.toISOString().slice(0, 10)
}
