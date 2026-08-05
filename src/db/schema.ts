import { pgTable, serial, text, integer, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").notNull().default("Code"),
  color: text("color").notNull().default("#3b82f6"),
  order: integer("order").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  tags: text("tags").array().notNull().default([]),
  complexity: text("complexity").notNull().default(""),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  hidden: boolean("hidden").notNull().default(false),
  copyCount: integer("copy_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  contributorName: text("contributor_name"),
  contributorCfHandle: text("contributor_cf_handle"),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const templateCodes = pgTable("template_codes", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  code: text("code").notNull().default(""),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  templates: many(templates),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  category: one(categories, { fields: [templates.categoryId], references: [categories.id] }),
  codes: many(templateCodes),
  likes: many(templateLikes),
}));

export const templateCodesRelations = relations(templateCodes, ({ one }) => ({
  template: one(templates, { fields: [templateCodes.templateId], references: [templates.id] }),
}));

export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),

  // The submitting account. Nullable so pre-account contributions remain valid,
  // and set-null on delete so approved contribution credit survives account removal.
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),

  contributorName: text("contributor_name").notNull(),
  contributorEmail: text("contributor_email").notNull(),
  contributorCfHandle: text("contributor_cf_handle"),

  title: text("title"),
  slug: text("slug"),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  tags: text("tags").array().default([]),
  complexity: text("complexity"),
  notes: text("notes"),
  codes: jsonb("codes"),

  templateId: integer("template_id").references(() => templates.id),
  editReason: text("edit_reason"),
  editCodes: jsonb("edit_codes"),
  editNotes: text("edit_notes"),

  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const contributionsRelations = relations(contributions, ({ one }) => ({
  category: one(categories, { fields: [contributions.categoryId], references: [categories.id] }),
  template: one(templates, { fields: [contributions.templateId], references: [templates.id] }),
  user: one(users, { fields: [contributions.userId], references: [users.id] }),
}));

export const templateHistory = pgTable("template_history", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  contributionId: integer("contribution_id"),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  categoryId: integer("category_id"),
  tags: text("tags").array().notNull().default([]),
  complexity: text("complexity").notNull().default(""),
  notes: text("notes"),
  hidden: boolean("hidden").notNull().default(false),
  contributorName: text("contributor_name"),
  contributorCfHandle: text("contributor_cf_handle"),
  codes: jsonb("codes"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const templateHistoryRelations = relations(templateHistory, ({ one }) => ({
  template: one(templates, { fields: [templateHistory.templateId], references: [templates.id] }),
}));

// ─── User Accounts ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  calendarToken: text("calendar_token"),
  handleVerifyToken: text("handle_verify_token"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationExpires: timestamp("verification_expires"),
  verificationAttempts: integer("verification_attempts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  name: text("name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  codeforcesHandle: text("codeforces_handle"),
  atcoderHandle: text("atcoder_handle"),
  leetcodeHandle: text("leetcode_handle"),
  codechefHandle: text("codechef_handle"),
  ratingGoal: text("rating_goal"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userTemplates = pgTable("user_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  customCode: text("custom_code").notNull(),
  language: text("language").notNull().default("cpp"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userCollections = pgTable("user_collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userCollectionItems = pgTable("user_collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => userCollections.id, { onDelete: "cascade" }),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("learning"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// One row per (user, template) like. The aggregate templates.likeCount is kept
// in sync so anonymous likes (no row here) and account likes share one counter.
export const templateLikes = pgTable("template_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.templateId)]);

// ─── User Relations ──────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  customTemplates: many(userTemplates),
  collections: many(userCollections),
  progress: many(userProgress),
  likes: many(templateLikes),
  contributions: many(contributions),
}));

export const templateLikesRelations = relations(templateLikes, ({ one }) => ({
  user: one(users, { fields: [templateLikes.userId], references: [users.id] }),
  template: one(templates, { fields: [templateLikes.templateId], references: [templates.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const userTemplatesRelations = relations(userTemplates, ({ one }) => ({
  user: one(users, { fields: [userTemplates.userId], references: [users.id] }),
  template: one(templates, { fields: [userTemplates.templateId], references: [templates.id] }),
}));

export const userCollectionsRelations = relations(userCollections, ({ one, many }) => ({
  user: one(users, { fields: [userCollections.userId], references: [users.id] }),
  items: many(userCollectionItems),
}));

export const userCollectionItemsRelations = relations(userCollectionItems, ({ one }) => ({
  collection: one(userCollections, { fields: [userCollectionItems.collectionId], references: [userCollections.id] }),
  template: one(templates, { fields: [userCollectionItems.templateId], references: [templates.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  template: one(templates, { fields: [userProgress.templateId], references: [templates.id] }),
}));
