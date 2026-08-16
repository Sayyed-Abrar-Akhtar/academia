import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique().default("pending@example.com"),
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  avatarUrl: text("avatar_url"),
  rollNumber: text("roll_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exams = pgTable("exams", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  countryCode: text("country_code").default("NP").notNull(),
  curriculumBoard: text("curriculum_board").default("NEB").notNull(),
});

export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .references(() => exams.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  weightMarks: integer("weight_marks").notNull(),
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id")
    .references(() => subjects.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .references(() => topics.id, { onDelete: "cascade" })
    .notNull(),
  body: text("body").notNull(),
  difficulty: text("difficulty").$type<"easy" | "medium" | "hard">().notNull(),
  explanation: text("explanation").notNull(),
  curriculumBoard: text("curriculum_board").default("NEB").notNull(),
});

export const questionOptions = pgTable("question_options", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label").$type<"A" | "B" | "C" | "D">().notNull(),
  body: text("body").notNull(),
  isCorrect: boolean("is_correct").notNull(),
});

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  questionId: text("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  selectedOptionId: text("selected_option_id")
    .references(() => questionOptions.id, { onDelete: "cascade" })
    .notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeTakenMs: integer("time_taken_ms").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
