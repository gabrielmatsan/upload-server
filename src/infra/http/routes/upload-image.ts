import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/upload',
    {
      schema: {
        summary: 'Upload an image',
        tags: ['upload'],
        body: z.object({
          name: z.string(),
        }),
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
    async (_request, reply) => {
      return reply.status(200).send({
        imageUrl: 'https://example.com/image.jpg',
      })
    }
  )
}
