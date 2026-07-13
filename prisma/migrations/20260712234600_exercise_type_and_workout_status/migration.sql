-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('WEIGHTED', 'BODYWEIGHT', 'TIMED');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "type" "ExerciseType" NOT NULL DEFAULT 'WEIGHTED';

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "WorkoutStatus" NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "completedAt" TIMESTAMP(3);
