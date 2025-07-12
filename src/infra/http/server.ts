import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastify from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { env } from '@/env/env'
import { transformSwaggerSchema } from '@/utils/transform-swagger-schema'
import { getUploadsRoutes } from './routes/get-uploads-images'
import { uploadImageRoute } from './routes/upload-image'
import { exportUploadsRoute } from './routes/export-uploads'

const server = fastify().withTypeProvider<ZodTypeProvider>()

server.setErrorHandler((error, _request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(422).send({
      message: 'Unprocessable Entity',
      issues: error.validation,
    })
  }
  // ENVIA O ERRO PARA ALGUMA FERRAMENTA DE LOG (SENTRY, DATADOG, GRAFANA)
  console.error(error)

  return reply.status(500).send({
    message: 'Internal Server Error',
  })
})

server.setSerializerCompiler(serializerCompiler)
server.setValidatorCompiler(validatorCompiler)
server.register(fastifyMultipart)

server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Upload Image API',
      version: '1.0.0',
    },
  },
  transform: transformSwaggerSchema,
})

server.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

server.register(fastifyCors, {
  origin: '*',
})

server.register(uploadImageRoute)
server.register(getUploadsRoutes)
server.register(exportUploadsRoute)

server.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(`Server is running on port ${env.PORT}`)
  console.log(`Docs: http://localhost:${env.PORT}/docs`)
})
