import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '@/infra/db'
import { uploadsSchema } from '@/infra/db/schemas/uploads'
import { isRight, unwrapEither } from '@/shared/either'
import { makeUpload } from '@/test/factories/make-upload'
import { getUploads } from './get-upload'

describe('get uploads', () => {
  beforeAll(async () => {
    await db.delete(uploadsSchema)
  })

  it('should be able to get uploads', async () => {
    const namePattern = `${randomUUID()}.jpeg`
    const _upload1 = await makeUpload({
      name: `${namePattern}`,
    })
    const _upload2 = await makeUpload({
      name: `${namePattern}2`,
    })

    const result = await getUploads({
      searchQuery: namePattern,
    })

    expect(isRight(result)).toBe(true)
    expect(unwrapEither(result).uploads).toHaveLength(2)
    expect(unwrapEither(result).total).toBe(2)
  })

  it('use search query to get uploads', async () => {
    const fileName = `${randomUUID()}.jpg`
    const fileName2 = `${randomUUID()}.webp`

    await makeUpload({
      name: fileName,
    })
    await makeUpload({
      name: fileName2,
    })

    const result = await getUploads({
      searchQuery: fileName,
    })

    console.log(unwrapEither(result))
    expect(isRight(result)).toBe(true)
    expect(unwrapEither(result).uploads).toHaveLength(1)
    expect(unwrapEither(result).total).toBe(1)
  })

  afterAll(async () => {
    await db.delete(uploadsSchema)
  })
})
