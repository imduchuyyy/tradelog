/*
  Warnings:

  - You are about to drop the column `description` on the `Setup` table. All the data in the column will be lost.
  - You are about to drop the column `journalQuestions` on the `Setup` table. All the data in the column will be lost.
  - You are about to drop the column `rules` on the `Setup` table. All the data in the column will be lost.
  - You are about to drop the column `leverage` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `psychology` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `setupReason` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `stopLoss` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `takeProfit` on the `Trade` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Setup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Setup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Setup" ("color", "createdAt", "id", "name", "updatedAt", "userId") SELECT "color", "createdAt", "id", "name", "updatedAt", "userId" FROM "Setup";
DROP TABLE "Setup";
ALTER TABLE "new_Setup" RENAME TO "Setup";
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
    "pnl" REAL,
    "pnlPercent" REAL,
    "fees" REAL DEFAULT 0,
    "marketCondition" TEXT,
    "session" TEXT,
    "entryTimeframe" TEXT,
    "riskRewardRatio" REAL,
    "confidenceLevel" INTEGER,
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
INSERT INTO "new_Trade" ("confidenceLevel", "createdAt", "disciplineLevel", "entryDate", "entryPrice", "entryTimeframe", "exchangeId", "exitDate", "exitPrice", "exitReason", "externalTradeId", "fees", "holdingTime", "id", "isNew", "lessons", "mae", "marketCondition", "mfe", "needsJournal", "notes", "pnl", "pnlPercent", "quantity", "riskRewardRatio", "session", "side", "status", "symbol", "syncedAt", "updatedAt", "userId") SELECT "confidenceLevel", "createdAt", "disciplineLevel", "entryDate", "entryPrice", "entryTimeframe", "exchangeId", "exitDate", "exitPrice", "exitReason", "externalTradeId", "fees", "holdingTime", "id", "isNew", "lessons", "mae", "marketCondition", "mfe", "needsJournal", "notes", "pnl", "pnlPercent", "quantity", "riskRewardRatio", "session", "side", "status", "symbol", "syncedAt", "updatedAt", "userId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE UNIQUE INDEX "Trade_externalTradeId_key" ON "Trade"("externalTradeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
