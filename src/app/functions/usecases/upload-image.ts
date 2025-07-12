import { Readable } from 'node:stream'
import { z } from 'zod/v4'
import { InvalidFileFormatError } from '@/app/errors/invalid-file-format-error'
import { db } from '@/infra/db'
import { uploadsSchema } from '@/infra/db/schemas/uploads'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { type Either, makeLeft, makeRight } from '@/shared/either'

export const uploadImageRequest = z.object({
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
export type UploadImageRequest = z.input<typeof uploadImageRequest>

export async function uploadImage(
  data: UploadImageRequest
): Promise<Either<InvalidFileFormatError, { url: string }>> {
  const { fileName, contentType, contentStream } =
    uploadImageRequest.parse(data)

  if (!allowedMimeTypes.includes(contentType)) {
    return makeLeft(new InvalidFileFormatError())
  }

  //TODO: Carregar a imagem para o Cloudflare R2 e inserir no banco de dados
  const { key, url } = await uploadFileToStorage({
    folder: 'images',
    fileName,
    contentType,
    contentStream,
  })

  await db.insert(uploadsSchema).values({
    name: fileName,
    remoteKey: key,
    remoteUrl: url,
  })

  return makeRight({ url })
}
