import { randomUUID } from 'node:crypto'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const uploadsSchema = pgTable('uploads', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  remoteKey: text('remote_key').notNull().unique(),
  remoteUrl: text('remote_url').notNull(), // uma URL publica para acessar o arquivo, caso o arquivo seja privado, nao precisa ter, se uma aplicacao for um misto de ter ou nao ter, pode ser um campo opcional
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
