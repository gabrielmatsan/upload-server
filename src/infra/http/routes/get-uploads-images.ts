import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  getUploads,
  getUploadsInput,
  getUploadsOutput,
} from '@/app/functions/usecases/get-upload'
import { unwrapEither } from '@/shared/either'

export const getUploadsRoutes: FastifyPluginAsyncZod = async server => {
  server.get(
    '/uploads',
    {
      schema: {
        summary: 'Get uploads',
        description: 'Get uploads',
        tags: ['uploads'],
        querystring: getUploadsInput,
        response: {
          200: getUploadsOutput,
        },
      },
    },
    async (request, reply) => {
      const { searchQuery, sortBy, sortDirection, page, pageSize } =
        request.query

      const result = await getUploads({
        searchQuery,
        sortBy,
        sortDirection,
        page,
        pageSize,
      })

      const { total, uploads } = unwrapEither(result)

      await reply.status(200).send({
        total,
        uploads,
      })
    }
  )
}
