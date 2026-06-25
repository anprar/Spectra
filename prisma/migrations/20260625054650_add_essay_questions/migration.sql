-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttemptQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'multiple_choice',
    "questionTextSnapshot" TEXT NOT NULL,
    "explanationSnapshot" TEXT,
    "optionASnapshot" TEXT NOT NULL,
    "optionBSnapshot" TEXT NOT NULL,
    "optionCSnapshot" TEXT NOT NULL,
    "optionDSnapshot" TEXT NOT NULL,
    "optionESnapshot" TEXT,
    "correctOptionSnapshot" TEXT NOT NULL,
    "selectedOption" TEXT,
    "essayAnswer" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "pointValue" REAL NOT NULL DEFAULT 1.0,
    "manualScore" REAL,
    "isManuallyGraded" BOOLEAN NOT NULL DEFAULT false,
    "essayFeedback" TEXT,
    "answeredAt" DATETIME,
    CONSTRAINT "AttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttemptQuestion" ("answeredAt", "attemptId", "correctOptionSnapshot", "displayOrder", "explanationSnapshot", "id", "isCorrect", "optionASnapshot", "optionBSnapshot", "optionCSnapshot", "optionDSnapshot", "optionESnapshot", "pointValue", "questionId", "questionTextSnapshot", "selectedOption") SELECT "answeredAt", "attemptId", "correctOptionSnapshot", "displayOrder", "explanationSnapshot", "id", "isCorrect", "optionASnapshot", "optionBSnapshot", "optionCSnapshot", "optionDSnapshot", "optionESnapshot", "pointValue", "questionId", "questionTextSnapshot", "selectedOption" FROM "AttemptQuestion";
DROP TABLE "AttemptQuestion";
ALTER TABLE "new_AttemptQuestion" RENAME TO "AttemptQuestion";
CREATE UNIQUE INDEX "AttemptQuestion_attemptId_displayOrder_key" ON "AttemptQuestion"("attemptId", "displayOrder");
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'multiple_choice',
    "explanationText" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Question_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("bankId", "category", "createdAt", "difficulty", "explanationText", "id", "questionText", "status", "updatedAt") SELECT "bankId", "category", "createdAt", "difficulty", "explanationText", "id", "questionText", "status", "updatedAt" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
