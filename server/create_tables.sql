-- CreateEnum
CREATE TYPE "PortalUserStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('EMPLOYED', 'FRESHER', 'STUDENT', 'BETWEEN_JOBS');

-- CreateEnum
CREATE TYPE "QualificationLevel" AS ENUM ('TENTH', 'TWELFTH', 'DIPLOMA', 'UG', 'PG');

-- CreateEnum
CREATE TYPE "PreferredJobType" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'CONTRACT');

-- CreateEnum
CREATE TYPE "PreferredWorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ON_SITE');

-- CreateEnum
CREATE TYPE "PortalApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "portal_users" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "status" "PortalUserStatus" NOT NULL DEFAULT 'PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,

    CONSTRAINT "portal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_otps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "PortalApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "full_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "willing_to_relocate" BOOLEAN NOT NULL DEFAULT false,
    "preferred_cities" VARCHAR(500),
    "employment_status" "EmploymentType" NOT NULL,
    "current_company" VARCHAR(200) NOT NULL,
    "current_designation" VARCHAR(200) NOT NULL,
    "total_experience_years" INTEGER NOT NULL,
    "total_experience_months" INTEGER NOT NULL,
    "relevant_experience_years" INTEGER NOT NULL,
    "relevant_experience_months" INTEGER NOT NULL,
    "current_ctc_fixed" DECIMAL(12,2),
    "current_ctc_variable" DECIMAL(12,2),
    "expected_ctc" DECIMAL(12,2),
    "notice_period" VARCHAR(50) NOT NULL,
    "highest_qualification" "QualificationLevel" NOT NULL,
    "institution" VARCHAR(300) NOT NULL,
    "degree_specialization" VARCHAR(300) NOT NULL,
    "year_of_passing" INTEGER NOT NULL,
    "percentage_or_cgpa" VARCHAR(20) NOT NULL,
    "skills" JSONB,
    "preferred_job_type" "PreferredJobType" NOT NULL,
    "preferred_work_mode" "PreferredWorkMode" NOT NULL,
    "preferred_department" VARCHAR(100) NOT NULL,
    "role_of_interest" VARCHAR(100),
    "subscribe_job_alerts" BOOLEAN NOT NULL DEFAULT true,
    "resume_url" TEXT,
    "resume_file_name" VARCHAR(255),
    "portfolio_url" TEXT,
    "linkedin_url" VARCHAR(500),
    "github_url" VARCHAR(500),
    "other_links" JSONB,
    "pan_number" VARCHAR(10),
    "dpdp_consent" BOOLEAN NOT NULL DEFAULT false,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMPTZ,
    "candidate_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_employment_history" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "company" VARCHAR(200) NOT NULL,
    "role" VARCHAR(200) NOT NULL,
    "duration_from" VARCHAR(20) NOT NULL,
    "duration_to" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_employment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portal_users_email_key" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_users_email_idx" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_otps_user_id_purpose_idx" ON "portal_otps"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "portal_applications_status_idx" ON "portal_applications"("status");

-- CreateIndex
CREATE INDEX "portal_applications_user_id_idx" ON "portal_applications"("user_id");

-- CreateIndex
CREATE INDEX "portal_employment_history_application_id_idx" ON "portal_employment_history"("application_id");

-- AddForeignKey
ALTER TABLE "portal_otps" ADD CONSTRAINT "portal_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_applications" ADD CONSTRAINT "portal_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_employment_history" ADD CONSTRAINT "portal_employment_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "portal_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

