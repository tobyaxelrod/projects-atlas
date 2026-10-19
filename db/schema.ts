import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const atlasState = sqliteTable('atlas_state', {id:text('id').primaryKey(), revision:integer('revision').notNull().default(0), payload:text('payload').notNull()});
