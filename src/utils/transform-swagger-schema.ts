import { jsonSchemaTransform } from 'fastify-type-provider-zod'

// Equivalente ao type de data do jsonSchemaTransform
export type TransformSwaggerSchemaData = Parameters<
  typeof jsonSchemaTransform
>[0]
export function transformSwaggerSchema(_data: TransformSwaggerSchemaData) {
  const { schema, url } = jsonSchemaTransform(_data)

  if (schema.consumes?.includes('multipart/form-data')) {
    if (schema.body === undefined) {
      schema.body = {
        type: 'object',
        required: [],
        properties: {},
      }
    }

    // @ts-expect-error
    schema.body.properties.file = {
      type: 'string',
      format: 'binary',
    }

    // @ts-expect-error
    schema.body.required.push('file')
  }

  return {
    schema,
    url,
  }
}
