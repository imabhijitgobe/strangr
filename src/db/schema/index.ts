import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Users (Anonymous) ───────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    socketId: text("socket_id").unique().notNull(),
    ipHash: text("ip_hash").notNull(), // hashed IP for ban enforcement
    interests: text("interests").array().default([]),
    isBanned: boolean("is_banned").default(false).notNull(),
    banReason: text("ban_reason"),
    bannedUntil: timestamp("banned_until"),
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_socket_id_idx").on(table.socketId),
    index("users_ip_hash_idx").on(table.ipHash),
    index("users_last_active_at_idx").on(table.lastActiveAt),
    index("users_is_banned_idx").on(table.isBanned),
  ]
);

// ─── Chat Sessions ───────────────────────────────────────────────────────────

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: serial("id").primaryKey(),
    userOneId: integer("user_one_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    userTwoId: integer("user_two_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type", { enum: ["text", "video"] }).notNull(),
    status: text("status", {
      enum: ["active", "ended", "disconnected"],
    })
      .default("active")
      .notNull(),
    matchedInterests: text("matched_interests").array(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
  },
  (table) => [
    index("chat_sessions_user_one_id_idx").on(table.userOneId),
    index("chat_sessions_user_two_id_idx").on(table.userTwoId),
    index("chat_sessions_status_idx").on(table.status),
    index("chat_sessions_type_idx").on(table.type),
    index("chat_sessions_started_at_idx").on(table.startedAt),
  ]
);

// ─── Messages ────────────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .references(() => chatSessions.id, { onDelete: "cascade" })
      .notNull(),
    senderId: integer("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    type: text("type", { enum: ["text", "system"] })
      .default("text")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_session_id_idx").on(table.sessionId),
    index("messages_sender_id_idx").on(table.senderId),
    index("messages_created_at_idx").on(table.createdAt),
  ]
);

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: integer("reporter_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    reportedUserId: integer("reported_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: integer("session_id").references(() => chatSessions.id, {
      onDelete: "set null",
    }),
    reason: text("reason", {
      enum: ["inappropriate", "spam", "harassment", "underage", "other"],
    }).notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["pending", "reviewed", "resolved", "dismissed"],
    })
      .default("pending")
      .notNull(),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reports_reporter_id_idx").on(table.reporterId),
    index("reports_reported_user_id_idx").on(table.reportedUserId),
    index("reports_session_id_idx").on(table.sessionId),
    index("reports_status_idx").on(table.status),
    index("reports_created_at_idx").on(table.createdAt),
  ]
);

// ─── Blocked Users ───────────────────────────────────────────────────────────

export const blockedUsers = pgTable(
  "blocked_users",
  {
    id: serial("id").primaryKey(),
    blockerId: integer("blocker_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    blockedId: integer("blocked_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("blocked_users_blocker_blocked_idx").on(
      table.blockerId,
      table.blockedId
    ),
    index("blocked_users_blocker_id_idx").on(table.blockerId),
    index("blocked_users_blocked_id_idx").on(table.blockedId),
  ]
);

// ─── Interests ───────────────────────────────────────────────────────────────

export const interests = pgTable(
  "interests",
  {
    id: serial("id").primaryKey(),
    name: text("name").unique().notNull(),
    category: text("category"),
    usageCount: integer("usage_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("interests_category_idx").on(table.category),
    index("interests_usage_count_idx").on(table.usageCount),
  ]
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  sessionsAsUserOne: many(chatSessions, { relationName: "userOneSessions" }),
  sessionsAsUserTwo: many(chatSessions, { relationName: "userTwoSessions" }),
  sentMessages: many(messages),
  reportsFiled: many(reports, { relationName: "reportsFiled" }),
  reportsReceived: many(reports, { relationName: "reportsReceived" }),
  blockedUsers: many(blockedUsers, { relationName: "blocker" }),
  blockedByUsers: many(blockedUsers, { relationName: "blocked" }),
}));

export const chatSessionsRelations = relations(
  chatSessions,
  ({ one, many }) => ({
    userOne: one(users, {
      fields: [chatSessions.userOneId],
      references: [users.id],
      relationName: "userOneSessions",
    }),
    userTwo: one(users, {
      fields: [chatSessions.userTwoId],
      references: [users.id],
      relationName: "userTwoSessions",
    }),
    messages: many(messages),
    reports: many(reports),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.sessionId],
    references: [chatSessions.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "reportsFiled",
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
    relationName: "reportsReceived",
  }),
  session: one(chatSessions, {
    fields: [reports.sessionId],
    references: [chatSessions.id],
  }),
}));

export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
  blocker: one(users, {
    fields: [blockedUsers.blockerId],
    references: [users.id],
    relationName: "blocker",
  }),
  blocked: one(users, {
    fields: [blockedUsers.blockedId],
    references: [users.id],
    relationName: "blocked",
  }),
}));
