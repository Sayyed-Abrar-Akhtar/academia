import { db, client } from "./index";
import { users, sessions, exams, subjects, topics, concepts, questions, questionOptions } from "./schema";

export async function initializeDatabase() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      mobile_number TEXT UNIQUE,
      password_hash TEXT,
      roll_number TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
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
    CREATE TABLE IF NOT EXISTS concepts (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      required_failed_attempts INTEGER NOT NULL DEFAULT 5
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
  await client.query("DELETE FROM concepts");
  await client.query("DELETE FROM topics");
  await client.query("DELETE FROM subjects");
  await client.query("DELETE FROM exams");
  await client.query("DELETE FROM sessions");
  await client.query("DELETE FROM users");

  console.log("Database cleared. Inserting demo/placeholder data...");

  // Seed demo user with mobile number and password hash
  const demoUser = {
    id: "demo-user-id",
    name: "Aarav Shrestha",
    email: "aarav.shrestha@example.com",
    mobileNumber: "+977-9801234567",
    passwordHash: "demo1234",
    rollNumber: "MECEE-2083-0447",
    createdAt: new Date(),
  };
  await db.insert(users).values(demoUser);

  // Seed a 14-day (1 fortnight) active session for the user
  const fortnightMs = 14 * 24 * 60 * 60 * 1000;
  const activeSession = {
    id: "sess-demo-001",
    userId: demoUser.id,
    token: "demo-fortnight-token-12345",
    expiresAt: new Date(Date.now() + fortnightMs),
    createdAt: new Date(),
  };
  await db.insert(sessions).values(activeSession);

  // Seed Exam
  const meceeExam = {
    id: "exam-mecee",
    slug: "mecee-bl",
    name: "MECEE-BL",
    countryCode: "NP",
    curriculumBoard: "NEB",
  };
  await db.insert(exams).values(meceeExam);

  // Seed Subjects
  const biologySubject = {
    id: "subj-biology",
    examId: meceeExam.id,
    name: "Biology",
    slug: "biology",
    weightMarks: 80,
  };
  await db.insert(subjects).values(biologySubject);

  const chemistrySubject = {
    id: "subj-chemistry",
    examId: meceeExam.id,
    name: "Chemistry",
    slug: "chemistry",
    weightMarks: 50,
  };
  await db.insert(subjects).values(chemistrySubject);

  // Seed Topics
  const geneticsTopic = {
    id: "topic-genetics",
    subjectId: biologySubject.id,
    name: "Genetics",
    slug: "genetics",
  };
  await db.insert(topics).values(geneticsTopic);

  const cellBiologyTopic = {
    id: "topic-cell-biology",
    subjectId: biologySubject.id,
    name: "Cell Biology",
    slug: "cell-biology",
  };
  await db.insert(topics).values(cellBiologyTopic);

  const organicChemistryTopic = {
    id: "topic-organic-chem",
    subjectId: chemistrySubject.id,
    name: "Organic Chemistry",
    slug: "organic-chemistry",
  };
  await db.insert(topics).values(organicChemistryTopic);

  // Seed Concept Summaries (Unlocked after 5+ failed attempts)
  const conceptsToSeed = [
    {
      id: "concept-genetics-summary",
      topicId: geneticsTopic.id,
      title: "Mendelian Inheritance & Semi-Conservative DNA Replication",
      summary:
        "Key Concept Breakdown:\n1. Monohybrid Cross (Tt × Tt): Phenotypic ratio is 3:1 (Tall:Dwarf), Genotypic ratio is 1:2:1 (TT:Tt:tt).\n2. DNA Semi-Conservative Replication: Demonstrated by Meselson & Stahl using 15N heavy isotope. Each daughter DNA duplex contains one original parent strand and one newly synthesized daughter strand.\n3. Universal Donor Blood Group: O Negative lacks A, B, and Rh (D) antigens on RBC membranes, allowing safe transfusions to all blood types.",
      requiredFailedAttempts: 5,
    },
    {
      id: "concept-cell-bio-summary",
      topicId: cellBiologyTopic.id,
      title: "Cell Organelles & Energetics",
      summary:
        "Key Concept Breakdown:\n1. Mitochondria: Double-membraned powerhouse generating ATP via oxidative phosphorylation across the inner cristae membrane.\n2. Ribosomes: Non-membranous site of protein synthesis (80S in eukaryotes, 70S in prokaryotes).\n3. Transpiration: Loss of water vapor from stomatal pores driven by negative xylem pressure potential.",
      requiredFailedAttempts: 5,
    },
    {
      id: "concept-organic-chem-summary",
      topicId: organicChemistryTopic.id,
      title: "Functional Groups & Reaction Mechanisms",
      summary:
        "Key Concept Breakdown:\n1. Nucleophilic Substitution (SN1 vs SN2): SN1 proceeds via a carbocation intermediate (favored in tertiary substrates), whereas SN2 occurs in a single concerted step with inversion of configuration (favored in primary substrates).\n2. IUPAC Nomenclature Priority: Carboxylic acids > Esters > Aldehydes > Ketones > Alcohols > Amines.",
      requiredFailedAttempts: 5,
    },
  ];

  for (const c of conceptsToSeed) {
    await db.insert(concepts).values(c);
  }

  // Expanded Quiz Questions Bank
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
    {
      id: "q-7",
      topicId: organicChemistryTopic.id,
      body: "Which functional group has the highest priority according to standard IUPAC rules?",
      difficulty: "medium" as const,
      explanation: "Carboxylic acid (-COOH) possesses the highest priority among the options listed.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-7-a", label: "A" as const, body: "Alcohol (-OH)", isCorrect: false },
        { id: "opt-7-b", label: "B" as const, body: "Aldehyde (-CHO)", isCorrect: false },
        { id: "opt-7-c", label: "C" as const, body: "Carboxylic acid (-COOH)", isCorrect: true },
        { id: "opt-7-d", label: "D" as const, body: "Ketone (>C=O)", isCorrect: false },
      ],
    },
    {
      id: "q-8",
      topicId: organicChemistryTopic.id,
      body: "SN1 reactions proceed via which characteristic intermediate?",
      difficulty: "hard" as const,
      explanation: "SN1 (unimolecular nucleophilic substitution) forms a planar carbocation intermediate in its rate-determining step.",
      curriculumBoard: "NEB",
      options: [
        { id: "opt-8-a", label: "A" as const, body: "Carbanion", isCorrect: false },
        { id: "opt-8-b", label: "B" as const, body: "Carbocation", isCorrect: true },
        { id: "opt-8-c", label: "C" as const, body: "Free radical", isCorrect: false },
        { id: "opt-8-d", label: "D" as const, body: "Transition state complex only", isCorrect: false },
      ],
    },
  ];

  for (const q of questionsToSeed) {
    const { options, ...questionData } = q;
    await db.insert(questions).values(questionData);
    await db.insert(questionOptions).values(options.map(opt => ({ ...opt, questionId: q.id })));
  }

  console.log("Database successfully seeded with demo user, 14-day session, concept summaries, and expanded question bank!");
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
