import { z } from 'zod/v4'

const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
})

export const env = envSchema.parse(process.env)
