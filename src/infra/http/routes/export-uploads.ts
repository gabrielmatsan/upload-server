import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  exportUploads,
  exportUploadsInput,
  exportUploadsOutput,
} from '@/app/functions/usecases/export-uploads'
import { unwrapEither } from '@/shared/either'

export const exportUploadsRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/upload/exports',
    {
      schema: {
        summary: 'Export uploads',
        description: 'Export uploads',
        tags: ['uploads'],
        querystring: exportUploadsInput,
        response: {
          200: exportUploadsOutput,
        },
      },
    },
    async (request, reply) => {
      const { searchQuery } = request.query

      const result = await exportUploads({
        searchQuery,
      })

      const { reportUrl } = unwrapEither(result)

      await reply.status(200).send({
        reportUrl,
      })
    }
  )
}
