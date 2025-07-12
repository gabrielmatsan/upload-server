import { randomUUID } from 'node:crypto'
import { basename, extname } from 'node:path'
import { Readable } from 'node:stream'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { z } from 'zod/v4'
import { env } from '@/env/env'
import { r2 } from './client'

export const uploadFileToStorageInput = z.object({
  folder: z.enum(['images', 'downloads']),
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

type UploadFileToStorageInput = z.infer<typeof uploadFileToStorageInput>

export async function uploadFileToStorage(input: UploadFileToStorageInput) {
  const { fileName, contentType, contentStream, folder } =
    uploadFileToStorageInput.parse(input)

  const fileExtension = extname(fileName)
  const fileNameWithoutExtension = basename(fileName)
  const sanitizedFileName = fileNameWithoutExtension.replace(
    /[^a-zA-Z0-9]/g,
    ''
  )
  const sanitizedFileNameWithExtension = `${sanitizedFileName}${fileExtension}`

  const uniqueFileName = `${folder}/${randomUUID()}-${sanitizedFileNameWithExtension}`

  const upload = new Upload({
    client: r2,
    params: {
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: uniqueFileName,
      Body: contentStream,
      ContentType: contentType,
    },
  })

  await upload.done()

  return {
    key: uniqueFileName,
    url: new URL(uniqueFileName, env.CLOUDFLARE_PUBLIC_URL).toString(),
  }
}

export async function deleteFileFromStorage(_path: string) {
  const deletedObject = await r2.send(
    new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: _path,
    })
  )

  return deletedObject
}
