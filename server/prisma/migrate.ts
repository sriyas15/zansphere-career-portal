import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

// Use DIRECT_URL (port 5432) for DDL — pgbouncer (port 6543) silently drops CREATE TABLE
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🔧 Creating Career Portal tables...\n');

  // Create enums (IF NOT EXISTS is only available in PG 9.1+)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PortalUserStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "EmploymentType" AS ENUM ('EMPLOYED', 'FRESHER', 'STUDENT', 'BETWEEN_JOBS');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "QualificationLevel" AS ENUM ('TENTH', 'TWELFTH', 'DIPLOMA', 'UG', 'PG');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PreferredJobType" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'CONTRACT');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PreferredWorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ON_SITE');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PortalApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'WITHDRAWN');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create portal_users table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "portal_users" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "first_name" VARCHAR(100) NOT NULL,
      "last_name" VARCHAR(100) NOT NULL,
      "email" VARCHAR(255) NOT NULL,
      "password_hash" VARCHAR(255) NOT NULL,
      "phone" VARCHAR(20) NOT NULL,
      "status" "PortalUserStatus" NOT NULL DEFAULT 'PENDING',
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
      "locked_until" TIMESTAMPTZ,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "portal_users_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "portal_users_email_key" UNIQUE ("email")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "portal_users_email_idx" ON "portal_users" ("email");
  `);

  // Create portal_otps table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "portal_otps" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "user_id" UUID NOT NULL,
      "code" VARCHAR(255) NOT NULL,
      "purpose" "OtpPurpose" NOT NULL,
      "expires_at" TIMESTAMPTZ NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "portal_otps_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "portal_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "portal_otps_user_purpose_idx" ON "portal_otps" ("user_id", "purpose");
  `);

  // Create portal_applications table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "portal_applications" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "user_id" UUID NOT NULL,
      "job_id" UUID NOT NULL,
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
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "portal_applications_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "portal_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE,
      CONSTRAINT "portal_applications_user_job_key" UNIQUE ("user_id", "job_id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "portal_applications_job_id_idx" ON "portal_applications" ("job_id");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "portal_applications_status_idx" ON "portal_applications" ("status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "portal_applications_user_id_idx" ON "portal_applications" ("user_id");
  `);

  // Alter existing table to add new columns
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "portal_applications" ADD COLUMN "other_links" JSONB;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "portal_applications" ADD COLUMN "pan_number" VARCHAR(10);
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `);

  // Create portal_employment_history table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "portal_employment_history" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "application_id" UUID NOT NULL,
      "company" VARCHAR(200) NOT NULL,
      "role" VARCHAR(200) NOT NULL,
      "duration_from" VARCHAR(20) NOT NULL,
      "duration_to" VARCHAR(20) NOT NULL,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "portal_employment_history_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "portal_employment_history_app_id_fkey" FOREIGN KEY ("application_id") REFERENCES "portal_applications"("id") ON DELETE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "portal_employment_history_app_idx" ON "portal_employment_history" ("application_id");
  `);

  console.log('✅ All Career Portal tables created successfully!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Migration error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
