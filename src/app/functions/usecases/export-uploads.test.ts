import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { db } from '@/infra/db'
import { uploadsSchema } from '@/infra/db/schemas/uploads'
import * as uploadFileToStorage from '@/infra/storage/upload-file-to-storage'
import { isRight, unwrapEither } from '@/shared/either'
import { makeUpload } from '@/test/factories/make-upload'
import { exportUploads } from './export-uploads'

describe('export uploads', () => {
  beforeAll(async () => {
    await db.delete(uploadsSchema)

    beforeAll(async () => {
      await db.delete(uploadsSchema)
    })
  })

  it('should be able to get uploads', async () => {
    const uploadStub = vi
      .spyOn(uploadFileToStorage, 'uploadFileToStorage')
      .mockImplementationOnce(async () => {
        return {
          key: `${randomUUID()}.csv`,
          url: 'https://example.com/test.csv',
        }
      })

    const namePattern = `${randomUUID()}.jpg`
    const _upload1 = await makeUpload({
      name: `${namePattern}1`,
    })
    const _upload2 = await makeUpload({
      name: `${namePattern}2`,
    })
    const _upload3 = await makeUpload({
      name: `${namePattern}2`,
    })
    const _upload4 = await makeUpload({
      name: `${namePattern}3`,
    })
    const _upload5 = await makeUpload({
      name: `${namePattern}4`,
    })

    const sut = await exportUploads({
      searchQuery: namePattern,
    })

    const generatedCsvStream = uploadStub.mock.calls[0][0].contentStream

    const csvAsString = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []

      generatedCsvStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      generatedCsvStream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf-8'))
      })

      generatedCsvStream.on('error', reject)
    })

    const csvAsArray = csvAsString
      .trim()
      .split('\n')
      .map(line => line.split(','))

    console.log(csvAsArray)

    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut)).toEqual({
      reportUrl: 'https://example.com/test.csv',
    })

    expect(csvAsArray[0]).toEqual(['ID', 'Nome', 'URL remota', 'Criado em'])
    expect(csvAsArray).toHaveLength(6) // header + 5 uploads
  })

  afterAll(async () => {
    await db.delete(uploadsSchema)
  })
})
