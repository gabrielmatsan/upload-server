import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { InvalidFileFormatError } from '@/app/errors/invalid-file-format-error'
import { db } from '@/infra/db'
import { uploadsSchema } from '@/infra/db/schemas/uploads'
import { isLeft, isRight, unwrapEither } from '@/shared/either'
import { uploadImage } from './upload-image'

describe('Upload Image', () => {
  beforeAll(async () => {
    await db.delete(uploadsSchema)

    vi.mock('@/infra/storage/upload-file-to-storage', () => {
      return {
        uploadFileToStorage: vi.fn().mockImplementation(() => {
          return {
            key: `${randomUUID()}.jpg`,
            url: 'https://example.com/test.jpg',
          }
        }),
      }
    })
  })

  it('should be able to upload an image', async () => {
    const fileName = `${randomUUID()}.jpg`

    // system under test
    const sut = await uploadImage({
      fileName: fileName,
      contentType: 'image/png',
      contentStream: Readable.from([]),
    })

    expect(isRight(sut)).toBe(true)

    const result = await db
      .select()
      .from(uploadsSchema)
      .where(eq(uploadsSchema.name, fileName))

    expect(result).toHaveLength(1)
  })

  it('should notbe able to upload an invalid file', async () => {
    const fileName = `${randomUUID()}.jpg`

    // system under test
    const sut = await uploadImage({
      fileName: fileName,
      contentType: 'image/pdf',
      contentStream: Readable.from([]),
    })

    expect(isLeft(sut)).toBe(true)

    const _result = await db
      .select()
      .from(uploadsSchema)
      .where(eq(uploadsSchema.name, fileName))

    expect(unwrapEither(sut)).toBeInstanceOf(InvalidFileFormatError)
  })

  afterAll(async () => {
    await db.delete(uploadsSchema)
  })
})
