import { z } from 'zod'

export const WeatherDataSchema = z.object({
  temperature: z.number(),
  weatherCode: z.number().int(),
  precipitationProbability: z.number().min(0).max(100),
  conditionStr: z.string(),
  tempDiff: z.number().optional(),
  isDay: z.boolean().optional(),
  apparentTemp: z.number().optional(),
  humidity: z.number().optional(),
  windSpeed: z.number().optional(),
  updatedAt: z.string().optional()
})

export const TrafficInfoSchema = z.object({
  roadName: z.string(),
  speed: z.number().nonnegative(),
  status: z.enum(['원활', '서행', '정체', '정보없음']),
  message: z.string()
})

export const FlightInfoSchema = z.object({
  airport: z.string(),
  flightName: z.string(),
  expectedArrivalTime: z.string(),
  status: z.enum(['정상', '지연', '결항']),
  passengerCountEst: z.number().int().nonnegative()
})

export const TrainInfoSchema = z.object({
  station: z.string(),
  trainName: z.string(),
  arrivalTime: z.string(),
  surgeLevel: z.enum(['HIGH', 'MEDIUM', 'LOW'])
})
