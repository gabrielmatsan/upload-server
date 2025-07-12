import { PassThrough, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { stringify } from 'csv-stringify'
import { ilike } from 'drizzle-orm'
import { z } from 'zod/v4'
import { db, pg } from '@/infra/db'
import { uploadsSchema } from '@/infra/db/schemas/uploads'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { makeRight } from '@/shared/either'

export const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
})

export const exportUploadsOutput = z.object({
  reportUrl: z.string(),
})


export type ExportUploadsInput = z.input<typeof exportUploadsInput>

export type ExportUploadsOutput = z.infer<typeof exportUploadsOutput>

export const exportUploads = async (input: ExportUploadsInput) => {
  const { searchQuery } = input

  const { sql, params } = db
    .select({
      id: uploadsSchema.id,
      name: uploadsSchema.name,
      createdAt: uploadsSchema.createdAt,
      remoteUrl: uploadsSchema.remoteUrl,
    })
    .from(uploadsSchema)
    .where(
      searchQuery ? ilike(uploadsSchema.name, `%${searchQuery}%`) : undefined
    )
    .toSQL()

  const cursor = pg.unsafe(sql, params as string[]).cursor(5)

  const csv = stringify({
    delimiter: ',',
    header: true,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Nome' },
      { key: 'remote_url', header: 'URL remota' },
      { key: 'created_at', header: 'Criado em' },
    ],
  })

  const uploadToStorageStream = new PassThrough()

  const convertToCSVPipeline = pipeline(
    cursor,
    new Transform({
      objectMode: true,
      transform(chunks: unknown[], encoding, callback) {
        for (const chunk of chunks) {
          this.push(chunk)
        }
        callback()
      },
    }),
    csv,
    uploadToStorageStream
  )

  const uploadToStorage = uploadFileToStorage({
    contentType: 'text/csv',
    folder: 'downloads',
    fileName: `${new Date().toISOString()}-uploads.csv`,
    contentStream: uploadToStorageStream,
  })

  const [{ url }] = await Promise.all([uploadToStorage, convertToCSVPipeline])

  await convertToCSVPipeline

  return makeRight({
    reportUrl: url,
  })
}
