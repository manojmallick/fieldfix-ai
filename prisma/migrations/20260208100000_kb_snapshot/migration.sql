-- CreateTable
CREATE TABLE "KBSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "kbId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    CONSTRAINT "KBSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "KBSnapshot_sessionId_idx" ON "KBSnapshot"("sessionId");

-- CreateIndex
CREATE INDEX "KBSnapshot_kbId_idx" ON "KBSnapshot"("kbId");
