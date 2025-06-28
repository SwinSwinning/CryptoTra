/*
  Warnings:

  - You are about to drop the column `percent_change_24h` on the `Candle` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Candle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" TEXT NOT NULL,
    "UCID" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "percent_change_15m" REAL NOT NULL,
    "percent_change_30m" REAL NOT NULL,
    "percent_change_1h" REAL NOT NULL
);
INSERT INTO "new_Candle" ("UCID", "id", "name", "percent_change_15m", "percent_change_1h", "percent_change_30m", "price", "symbol", "timestamp") SELECT "UCID", "id", "name", "percent_change_15m", "percent_change_1h", "percent_change_30m", "price", "symbol", "timestamp" FROM "Candle";
DROP TABLE "Candle";
ALTER TABLE "new_Candle" RENAME TO "Candle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
