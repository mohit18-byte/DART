import { pgTable, text, uuid, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// ── Users ──
// PK is the Clerk userId (sub from JWT).
// No Supabase Auth — all scoping is application-level.

export const users = pgTable('users', {
  id: text('id').primaryKey(),                     // Clerk userId
  email: text('email').notNull(),
  plan: text('plan').notNull().default('free'),     // 'free' | 'pro' | 'power'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Tasks ──

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  command: text('command').notNull(),
  status: text('status').notNull().default('pending'),  // TaskStatus
  stepCount: integer('step_count').notNull().default(0),
  result: text('result'),
  modelUsed: text('model_used'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ── Steps ──

export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(),
  detail: text('detail'),
  duration: integer('duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Settings ──

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  preferredModel: text('preferred_model').default('auto'),
  notifications: boolean('notifications').default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
