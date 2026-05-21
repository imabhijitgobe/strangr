---
inclusion: auto
---

# Neon Postgres & Drizzle ORM Agent

You are a Neon serverless Postgres and Drizzle ORM specialist. Apply these best practices when working with the database layer in this project.

## Project Database Setup

- **Provider**: Neon Serverless PostgreSQL
- **ORM**: Drizzle ORM v0.45.2 with `neon-http` driver
- **Schema location**: `src/db/schema/index.ts`
- **Migrations**: `src/db/migrations/`
- **Connection**: `src/db/index.ts`

## Connection Pattern

```typescript
// src/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

## Schema Design Best Practices

### Data Types

- Prefer `text` over `varchar(n)` unless a length constraint is meaningful to the domain
- Use `timestamp` with timezone awareness (`timestamp("col").defaultNow()`) for all time fields
- Use `uuid` for primary keys when IDs may be exposed externally or generated client-side
- Use `serial` for internal auto-increment IDs (current pattern in this project)

### Current Schema

```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Adding New Tables

Follow this pattern for new tables:

```typescript
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for query builder
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

## Query Patterns

### Basic CRUD

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Create
await db.insert(users).values({
  clerkId: "user_123",
  email: "user@example.com",
});

// Read
const user = await db.query.users.findFirst({
  where: eq(users.clerkId, "user_123"),
});

// Read many
const allUsers = await db.query.users.findMany({
  limit: 10,
  offset: 0,
  orderBy: (users, { desc }) => [desc(users.createdAt)],
});

// Update
await db.update(users)
  .set({ email: "new@example.com", updatedAt: new Date() })
  .where(eq(users.clerkId, "user_123"));

// Delete
await db.delete(users).where(eq(users.clerkId, "user_123"));
```

### With Relations

```typescript
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.clerkId, "user_123"),
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    },
  },
});
```

### Transactions

```typescript
import { db } from "@/db";

const result = await db.transaction(async (tx) => {
  const user = await tx.insert(users).values({ ... }).returning();
  await tx.insert(posts).values({ authorId: user[0].id, ... });
  return user[0];
});
```

## Indexing Best Practices

```typescript
import { pgTable, text, index } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  // ... columns
}, (table) => ({
  authorIdx: index("posts_author_id_idx").on(table.authorId),
  titleIdx: index("posts_title_idx").on(table.title),
}));
```

### When to Add Indexes

- Foreign key columns (always)
- Columns used in WHERE clauses frequently
- Columns used in ORDER BY
- Columns used in JOIN conditions
- Unique constraints (automatically indexed)

### When NOT to Index

- Small tables (< 1000 rows)
- Columns with very low cardinality (boolean)
- Tables with heavy write loads and few reads

## Migration Workflow

```bash
# Generate migration from schema changes
npm run db:generate

# Push schema directly to database (dev only)
npm run db:push

# Open Drizzle Studio for visual DB management
npm run db:studio
```

### Migration Best Practices

1. Always generate migrations for production changes
2. Use `db:push` only in development for rapid iteration
3. Review generated SQL before applying
4. Never modify migration files after they've been applied

## Neon-Specific Features

### Branching (for development)

Neon supports database branching — create isolated copies for development:
- Use separate branches for feature development
- Branch from production for realistic test data
- Branches are copy-on-write (instant, no storage cost until writes)

### Connection Pooling

The `@neondatabase/serverless` driver handles connection pooling automatically for serverless environments. No additional configuration needed.

### Cold Starts

Neon scales to zero. First query after inactivity may have ~500ms latency. Mitigations:
- Use connection warming in middleware for critical paths
- Accept cold start for non-critical background operations

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| `DATABASE_URL` undefined | Missing env var | Add to `.env.local` |
| Migration conflicts | Schema out of sync | Run `db:generate` then `db:push` |
| Slow first query | Neon cold start | Normal for serverless, warms up |
| Type errors in queries | Schema mismatch | Regenerate types with `db:generate` |
| Connection timeout | Network/firewall | Check Neon dashboard for connection string |

## Security

- Never expose `DATABASE_URL` to the client (no `NEXT_PUBLIC_` prefix)
- Use parameterized queries (Drizzle does this by default)
- Validate and sanitize user input before database operations
- Use Row Level Security (RLS) for multi-tenant data isolation when needed

## Performance Tips

- Use `select()` to limit returned columns when you don't need all fields
- Use `limit()` and `offset()` for pagination
- Prefer `findFirst()` over `findMany()` when expecting single result
- Use `Promise.all()` for independent parallel queries
- Add indexes for frequently queried columns
