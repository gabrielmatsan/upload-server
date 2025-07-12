import { fakerPT_BR as faker } from '@faker-js/faker'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '@/infra/db'
import { uploadsSchema } from '@/infra/db/schemas/uploads'

export async function makeUpload(
  overrides?: Partial<InferSelectModel<typeof uploadsSchema>>
) {


  const fileName = faker.system.fileName()
  const [result] = await db
    .insert(uploadsSchema)
    .values({
      name: fileName,
      remoteKey: `images/${fileName}`,
      remoteUrl: `http://example.com/${fileName}`,
      ...overrides,
    })
    .returning()

  return result
}
