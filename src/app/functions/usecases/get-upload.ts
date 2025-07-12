import { asc, count, desc, ilike } from 'drizzle-orm'
import { z } from 'zod/v4'
import { db } from '@/infra/db'
import { uploadsSchema } from '@/infra/db/schemas/uploads'
import { type Either, makeRight } from '@/shared/either'

export const getUploadsInput = z.object({
  searchQuery: z.string().optional(),
  sortBy: z.enum(['createdAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(20),
})

export type GetUploadsInput = z.input<typeof getUploadsInput>

export const getUploadsOutput = z.object({
  total: z.number(),
  uploads: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: z.date(),
      remoteKey: z.string(),
      remoteUrl: z.string(),
    })
  ),
})

export type GetUploadsOutput = z.infer<typeof getUploadsOutput>

export async function getUploads(
  input: GetUploadsInput
): Promise<Either<never, GetUploadsOutput>> {
  const { searchQuery, sortBy, sortDirection, page, pageSize } =
    getUploadsInput.parse(input)

  const [uploads, [{ total }]] = await Promise.all([
    db
      .select({
        id: uploadsSchema.id,
        name: uploadsSchema.name,
        createdAt: uploadsSchema.createdAt,
        remoteKey: uploadsSchema.remoteKey,
        remoteUrl: uploadsSchema.remoteUrl,
      })
      .from(uploadsSchema)
      .where(
        searchQuery ? ilike(uploadsSchema.name, `%${searchQuery}%`) : undefined
      )
      .orderBy(fields => {
        if (sortBy && sortDirection === 'asc') {
          return asc(fields[sortBy])
        }
        if (sortBy && sortDirection === 'desc') {
          return desc(fields[sortBy])
        }
        return desc(fields.id)
      })
      .offset((page - 1) * pageSize)
      .limit(pageSize),

    db
      .select({
        total: count(uploadsSchema.id),
      })
      .from(uploadsSchema)
      .where(
        searchQuery ? ilike(uploadsSchema.name, `%${searchQuery}%`) : undefined
      ),
  ])

  return makeRight({
    uploads,
    total,
  })
}
