/*
  Warnings:

  - You are about to drop the column `credit_limit` on the `merchants` table. All the data in the column will be lost.
  - You are about to drop the column `credit_limit` on the `wholesalers` table. All the data in the column will be lost.
  - Added the required column `production_Scope` to the `producers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductionScope" AS ENUM ('Very_Large', 'Large', 'Medium', 'Small');

-- AlterTable
ALTER TABLE "merchants" DROP COLUMN "credit_limit";

-- AlterTable
ALTER TABLE "producers" ADD COLUMN     "production_Scope" "ProductionScope" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "Logo_link" TEXT;

-- AlterTable
ALTER TABLE "wholesalers" DROP COLUMN "credit_limit",
ADD COLUMN     "scope" TEXT;
