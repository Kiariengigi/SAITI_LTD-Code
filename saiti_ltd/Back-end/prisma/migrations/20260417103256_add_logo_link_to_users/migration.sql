/*
  Warnings:

  - The `scope` column on the `wholesalers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('KM10', 'KM50', 'KM100', 'KM200', 'KM250');

-- AlterTable
ALTER TABLE "wholesalers" DROP COLUMN "scope",
ADD COLUMN     "scope" "Scope";
