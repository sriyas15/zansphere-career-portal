const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    // 1. Drop old tables
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "portal_employment_history" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "portal_applications" CASCADE;`);
    console.log("Old tables dropped.");
    
    // 2. Create portal_profiles
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "portal_profiles" (
          "id" UUID NOT NULL,
          "user_id" UUID NOT NULL,
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
          "is_complete" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "portal_profiles_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // 3. Create portal_job_applications
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "portal_job_applications" (
          "id" UUID NOT NULL,
          "short_id" VARCHAR(12) NOT NULL,
          "user_id" UUID NOT NULL,
          "job_id" UUID,
          "job_title" VARCHAR(200) NOT NULL,
          "candidate_id" UUID NOT NULL,
          "status" "PortalApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
          "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "portal_job_applications_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // 4. Create portal_employment_history
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "portal_employment_history" (
          "id" UUID NOT NULL,
          "profile_id" UUID NOT NULL,
          "company" VARCHAR(200) NOT NULL,
          "role" VARCHAR(200) NOT NULL,
          "duration_from" VARCHAR(20) NOT NULL,
          "duration_to" VARCHAR(20) NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "portal_employment_history_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // 5. Create portal_education_history
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "portal_education_history" (
          "id" UUID NOT NULL,
          "profile_id" UUID NOT NULL,
          "institution" VARCHAR(300) NOT NULL,
          "degree_specialization" VARCHAR(300) NOT NULL,
          "year_of_passing" INTEGER NOT NULL,
          "percentage_or_cgpa" VARCHAR(20) NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "portal_education_history_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // 6. Indexes and FKs
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "portal_profiles_user_id_key" ON "portal_profiles"("user_id");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "portal_job_applications_short_id_key" ON "portal_job_applications"("short_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "portal_job_applications_user_id_idx" ON "portal_job_applications"("user_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "portal_employment_history_profile_id_idx" ON "portal_employment_history"("profile_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "portal_education_history_profile_id_idx" ON "portal_education_history"("profile_id");`);
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "portal_profiles" ADD CONSTRAINT "portal_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "portal_job_applications" ADD CONSTRAINT "portal_job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "portal_employment_history" ADD CONSTRAINT "portal_employment_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "portal_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "portal_education_history" ADD CONSTRAINT "portal_education_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "portal_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    
    console.log("New tables created successfully.");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
clean();
