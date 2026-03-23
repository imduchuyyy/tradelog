/*
  Warnings:

  - You are about to drop the column `setupId` on the `Trade` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exchange" ADD COLUMN "lastSyncAt" DATETIME;

-- AlterTable
ALTER TABLE "Setup" ADD COLUMN "journalQuestions" TEXT;

-- CreateTable
CREATE TABLE "_SetupToTrade" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SetupToTrade_A_fkey" FOREIGN KEY ("A") REFERENCES "Setup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SetupToTrade_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exchangeId" TEXT,
    "externalTradeId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "quantity" REAL NOT NULL,
    "leverage" REAL DEFAULT 1,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "pnl" REAL,
    "pnlPercent" REAL,
    "fees" REAL DEFAULT 0,
    "marketCondition" TEXT,
    "session" TEXT,
    "entryTimeframe" TEXT,
    "riskRewardRatio" REAL,
    "confidenceLevel" INTEGER,
    "setupReason" TEXT,
    "psychology" TEXT,
    "notes" TEXT,
    "exitReason" TEXT,
    "lessons" TEXT,
    "disciplineLevel" INTEGER,
    "holdingTime" INTEGER,
    "mae" REAL,
    "mfe" REAL,
    "needsJournal" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("confidenceLevel", "createdAt", "entryDate", "entryPrice", "exchangeId", "exitDate", "exitPrice", "fees", "id", "leverage", "marketCondition", "notes", "pnl", "pnlPercent", "psychology", "quantity", "setupReason", "side", "status", "stopLoss", "symbol", "takeProfit", "updatedAt", "userId") SELECT "confidenceLevel", "createdAt", "entryDate", "entryPrice", "exchangeId", "exitDate", "exitPrice", "fees", "id", "leverage", "marketCondition", "notes", "pnl", "pnlPercent", "psychology", "quantity", "setupReason", "side", "status", "stopLoss", "symbol", "takeProfit", "updatedAt", "userId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE UNIQUE INDEX "Trade_externalTradeId_key" ON "Trade"("externalTradeId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "trialEndsAt" DATETIME,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "locale", "name", "plan", "theme", "trialEndsAt", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "locale", "name", "plan", "theme", "trialEndsAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_SetupToTrade_AB_unique" ON "_SetupToTrade"("A", "B");

-- CreateIndex
CREATE INDEX "_SetupToTrade_B_index" ON "_SetupToTrade"("B");
