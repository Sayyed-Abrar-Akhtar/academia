import { db, client } from "./index";
import { users, exams, subjects, topics, questions, questionOptions } from "./schema";

export async function initializeDatabase() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      roll_number TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      country_code TEXT NOT NULL DEFAULT 'NP',
      curriculum_board TEXT NOT NULL DEFAULT 'NEB'
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      weight_marks INTEGER NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      explanation TEXT NOT NULL,
      curriculum_board TEXT NOT NULL DEFAULT 'NEB'
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      body TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_option_id TEXT NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
      is_correct BOOLEAN NOT NULL,
      time_taken_ms INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

export async function seed() {
  console.log("Starting DB initialization...");
  await initializeDatabase();
  console.log("DB initialized. Checking existing records...");

  await client.query("DELETE FROM attempts");
  await client.query("DELETE FROM question_options");
  await client.query("DELETE FROM questions");
  await client.query("DELETE FROM topics");
  await client.query("DELETE FROM subjects");
  await client.query("DELETE FROM exams");
  await client.query("DELETE FROM users");

  console.log("Database cleared. Inserting demo/placeholder data...");

  // Hardcoded demo user for local testing without real auth
  const demoUser = {
    id: "demo-user-id",
    name: "Aarav Shrestha",
    email: "aarav.shrestha@example.com",
    rollNumber: "MECEE-2083-0447",
    createdAt: new Date(),
  };
  await db.insert(users).values(demoUser);

  const meceeExam = {
    id: "exam-mecee",
    slug: "mecee-bl",
    name: "MECEE-BL",
    countryCode: "NP",
    curriculumBoard: "NEB",
  };
  await db.insert(exams).values(meceeExam);

  const biologySubject = {
    id: "subj-biology",
    examId: meceeExam.id,
    name: "Biology",
    slug: "biology",
    weightMarks: 80,
  };
  await db.insert(subjects).values(biologySubject);

  const geneticsTopic = {
    id: "topic-genetics",
    subjectId: biologySubject.id,
    name: "Genetics",
    slug: "genetics",
  };
  await db.insert(topics).values(geneticsTopic);

  // NOTE: DEMO / PLACEHOLDER CONTENT ONLY
  // The real question bank will be entered via an admin panel in a later phase, not hardcoded.
  const questionsToSeed = [
    {
      id: "q-1",
      topicId: geneticsTopic.id,
      body: 'Which organelle is known as the "powerhouse of the cell"?',
      difficulty: "easy" as const,
      explanation: "Mitochondria generate ATP through cellular respiration.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-1-a", label: "A" as const, body: "Golgi apparatus", isCorrect: false },
        { id: "opt-1-b", label: "B" as const, body: "Mitochondria", isCorrect: true },
        { id: "opt-1-c", label: "C" as const, body: "Ribosome", isCorrect: false },
        { id: "opt-1-d", label: "D" as const, body: "Lysosome", isCorrect: false },
      ],
    },
    {
      id: "q-2",
      topicId: geneticsTopic.id,
      body: "In a monohybrid cross between two heterozygous (Tt) pea plants, what is the expected phenotypic ratio of tall to dwarf offspring?",
      difficulty: "medium" as const,
      explanation: "Classic Mendelian monohybrid ratio from a Tt × Tt cross.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-2-a", label: "A" as const, body: "1:1", isCorrect: false },
        { id: "opt-2-b", label: "B" as const, body: "3:1", isCorrect: true },
        { id: "opt-2-c", label: "C" as const, body: "1:2:1", isCorrect: false },
        { id: "opt-2-d", label: "D" as const, body: "9:3:3:1", isCorrect: false },
      ],
    },
    {
      id: "q-3",
      topicId: geneticsTopic.id,
      body: 'Which blood group is considered the "universal donor"?',
      difficulty: "easy" as const,
      explanation: "O negative red cells lack A, B, and Rh antigens.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-3-a", label: "A" as const, body: "AB", isCorrect: false },
        { id: "opt-3-b", label: "B" as const, body: "A", isCorrect: false },
        { id: "opt-3-c", label: "C" as const, body: "B", isCorrect: false },
        { id: "opt-3-d", label: "D" as const, body: "O negative", isCorrect: true },
      ],
    },
    {
      id: "q-4",
      topicId: geneticsTopic.id,
      body: "The process by which plants lose water vapor through stomata is called:",
      difficulty: "easy" as const,
      explanation: "Transpiration is the loss of water vapor from plant leaves via stomata.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-4-a", label: "A" as const, body: "Osmosis", isCorrect: false },
        { id: "opt-4-b", label: "B" as const, body: "Transpiration", isCorrect: true },
        { id: "opt-4-c", label: "C" as const, body: "Respiration", isCorrect: false },
        { id: "opt-4-d", label: "D" as const, body: "Photosynthesis", isCorrect: false },
      ],
    },
    {
      id: "q-5",
      topicId: geneticsTopic.id,
      body: "Which hormone regulates blood glucose level by promoting glucose uptake into cells?",
      difficulty: "medium" as const,
      explanation: "Insulin promotes glucose uptake into cells, thus lowering blood glucose levels.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-5-a", label: "A" as const, body: "Glucagon", isCorrect: false },
        { id: "opt-5-b", label: "B" as const, body: "Insulin", isCorrect: true },
        { id: "opt-5-c", label: "C" as const, body: "Thyroxine", isCorrect: false },
        { id: "opt-5-d", label: "D" as const, body: "Adrenaline", isCorrect: false },
      ],
    },
    {
      id: "q-6",
      topicId: geneticsTopic.id,
      body: "DNA replication is described as semi-conservative because:",
      difficulty: "hard" as const,
      explanation: "Each new DNA molecule retains one strand from the parent molecule and has one newly synthesized strand.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-6-a", label: "A" as const, body: "Each new molecule has two new strands", isCorrect: false },
        { id: "opt-6-b", label: "B" as const, body: "Each new molecule has one old and one new strand", isCorrect: true },
        { id: "opt-6-c", label: "C" as const, body: "DNA is destroyed and rebuilt", isCorrect: false },
        { id: "opt-6-d", label: "D" as const, body: "Only RNA is used as template", isCorrect: false },
      ],
    },
  ];

  for (const q of questionsToSeed) {
    const { options, ...questionData } = q;
    await db.insert(questions).values(questionData);
    await db.insert(questionOptions).values(options.map(opt => ({ ...opt, questionId: q.id })));
  }

  console.log("Database successfully seeded with demo user and 6 Biology questions!");
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  seed()
    .then(() => {
      console.log("Seed completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
