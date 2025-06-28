-- CreateTable
CREATE TABLE "Candle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" TEXT NOT NULL,
    "UCID" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "percent_change_15m" REAL NOT NULL,
    "percent_change_30m" REAL NOT NULL,
    "percent_change_1h" REAL NOT NULL,
    "percent_change_24h" REAL NOT NULL
);
