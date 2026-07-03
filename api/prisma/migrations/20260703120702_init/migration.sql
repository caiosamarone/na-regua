-- CreateTable
CREATE TABLE "DeployTest" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeployTest_pkey" PRIMARY KEY ("id")
);
