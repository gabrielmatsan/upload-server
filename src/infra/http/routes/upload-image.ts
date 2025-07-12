import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { InvalidFileFormatError } from '@/app/errors/invalid-file-format-error'
import { uploadImage } from '@/app/functions/usecases/upload-image'
import { isRight, unwrapEither } from '@/shared/either'

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/upload',
    {
      schema: {
        summary: 'Upload an image',
        consumes: ['multipart/form-data'],
        tags: ['upload'],
        // body: z.object({
        //   file: z.instanceof(File),
        // }),
        response: {
          200: z.object({
            imageUrl: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const uploadedFile = await request.file({
        limits: {
          fileSize: 1024 * 1024 * 5, // 5MB
        },
      })

      if (!uploadedFile) {
        return reply.status(400).send({ message: 'File is required' })
      }

      const result = await uploadImage({
        fileName: uploadedFile.filename,
        contentType: uploadedFile.mimetype,
        contentStream: uploadedFile.file,
      })

      if (uploadedFile.file.truncated) {
        return reply.status(400).send({ message: 'File size is too large' })
      }

      // não é uma boa prática, pois o arquivo é carregado na memória, e ficará ocupando espaço na memória até o fim da execução, o garbage collector não irá liberar a memória ocupada pelo arquivo
      //const _file = await uploadedFile.toBuffer()

      if (isRight(result)) {
        console.log(unwrapEither(result))
        return reply.status(200).send({
          imageUrl: result.right.url,
        })
      }

      const error = unwrapEither(result)

      if (error instanceof InvalidFileFormatError) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: 'Internal server error' })
    }
  )
}
