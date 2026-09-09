/*
  Warnings:

  - Added the required column `clientApplicationId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "clientApplicationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientApplicationId_fkey" FOREIGN KEY ("clientApplicationId") REFERENCES "ClientApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
