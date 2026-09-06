-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'VOLUNTEER_MANAGER', 'GOVERNORATE_LEAD', 'TEAM_LEADER', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISTINGUISHED', 'DISCONTINUED', 'EXCLUDED', 'PENDING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'INTERVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConvoyStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VOLUNTEER',
    "volunteerCode" TEXT,
    "nationalId" TEXT,
    "dob" TIMESTAMP(3),
    "nationality" TEXT DEFAULT 'مصري',
    "governorate" TEXT DEFAULT 'الجيزة',
    "city" TEXT,
    "address" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "qualification" TEXT,
    "major" TEXT,
    "jobStatus" TEXT,
    "workplace" TEXT,
    "jobTitle" TEXT,
    "experience" TEXT,
    "skills" TEXT,
    "preferredFields" TEXT,
    "volunteerNature" TEXT,
    "availableDays" TEXT,
    "availableShift" TEXT,
    "weeklyHours" INTEGER DEFAULT 5,
    "canTravel" BOOLEAN DEFAULT true,
    "interests" TEXT,
    "volunteerGoals" TEXT,
    "leadershipExp" TEXT,
    "wantsLeadership" BOOLEAN DEFAULT false,
    "emergencyContact" TEXT,
    "specialNeeds" TEXT,
    "referralSource" TEXT,
    "referredBy" TEXT,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'ACTIVE',
    "level" TEXT DEFAULT 'متطوع جديد',
    "teamName" TEXT DEFAULT 'فريق الإغاثة الميدانية',
    "teamLeader" TEXT,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "convoysCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lastContactDate" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "notes" TEXT,
    "searchText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "dob" TIMESTAMP(3),
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "governorate" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "qualification" TEXT,
    "major" TEXT,
    "skills" TEXT,
    "preferredFields" TEXT,
    "emergencyContact" TEXT,
    "source" TEXT DEFAULT 'الموقع الإلكتروني',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "interviewDate" TIMESTAMP(3),
    "decision" TEXT,
    "reviewerName" TEXT,
    "volunteerCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewerId" TEXT,
    "interviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commitmentScore" INTEGER NOT NULL DEFAULT 20,
    "teamworkScore" INTEGER NOT NULL DEFAULT 20,
    "beneficiaryScore" INTEGER NOT NULL DEFAULT 20,
    "skillsScore" INTEGER NOT NULL DEFAULT 20,
    "leadershipScore" INTEGER NOT NULL DEFAULT 20,
    "totalScore" INTEGER NOT NULL DEFAULT 100,
    "recommendation" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "leaderName" TEXT,
    "deputyName" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Governorate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderName" TEXT,
    "deputyName" TEXT,
    "targetHours" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Governorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convoy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "supervisor" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL DEFAULT 20,
    "confirmedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ConvoyStatus" NOT NULL DEFAULT 'PLANNED',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convoy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "convoyId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "supervisor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'قيد التنفيذ',
    "result" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "convoyId" TEXT,
    "activityName" TEXT NOT NULL,
    "governorate" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLedger" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "evaluatorId" TEXT,
    "evaluatorName" TEXT,
    "evaluationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commitmentScore" INTEGER NOT NULL DEFAULT 5,
    "cooperationScore" INTEGER NOT NULL DEFAULT 5,
    "initiativeScore" INTEGER NOT NULL DEFAULT 5,
    "behaviorScore" INTEGER NOT NULL DEFAULT 5,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "recommendation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionRecord" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "lastActiveDate" TIMESTAMP(3),
    "reason" TEXT,
    "whatMotivated" TEXT,
    "whatEncourages" TEXT,
    "preferredField" TEXT,
    "availableTime" TEXT,
    "wantsToReturn" TEXT DEFAULT 'نعم يرغب',
    "lastContact" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "contactOutcome" TEXT,
    "nextAction" TEXT,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'قيد المتابعة',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCourse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trainer" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 4,
    "isLeadershipPrereq" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'متاح',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT true,
    "score" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "certificateCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "issuedById" TEXT,
    "qrToken" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_volunteerCode_key" ON "User"("volunteerCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "Application_code_key" ON "Application"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_applicationId_key" ON "Interview"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Governorate_name_key" ON "Governorate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Convoy_code_key" ON "Convoy"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_code_key" ON "TaskAssignment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_code_key" ON "AttendanceRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_volunteerId_convoyId_date_key" ON "AttendanceRecord"("volunteerId", "convoyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_courseId_volunteerId_key" ON "TrainingAttendance"("courseId", "volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_code_key" ON "Reward"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_qrToken_key" ON "Reward"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_convoyId_fkey" FOREIGN KEY ("convoyId") REFERENCES "Convoy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_convoyId_fkey" FOREIGN KEY ("convoyId") REFERENCES "Convoy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedger" ADD CONSTRAINT "PointsLedger_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionRecord" ADD CONSTRAINT "RetentionRecord_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionRecord" ADD CONSTRAINT "RetentionRecord_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

