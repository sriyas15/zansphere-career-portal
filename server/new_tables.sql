-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HR');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('DRAFT', 'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('INTERVIEW_COMMENT', 'HR_COMMENT');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('CANDIDATE', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('RESUME', 'PORTFOLIO', 'OFFER_LETTER', 'ID_PROOF', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CANDIDATE_ADDED', 'INTERVIEW_SCHEDULED', 'EMPLOYEE_ADDED', 'STAGE_ADVANCED', 'TASK_ASSIGNED', 'APPLICATION_REJECTED', 'APPLICATION_SELECTED');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('CANDIDATE', 'EMPLOYEE', 'JOB_OPENING', 'APPLICATION');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('APPLICATION', 'SCREENING', 'TASK', 'INTERVIEW', 'EVALUATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'ON_HOLD', 'CLOSED', 'FILLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('IN_PIPELINE', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "StageProgressStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "StageDecision" AS ENUM ('PENDING', 'PASS', 'FAIL', 'HOLD');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "InterviewRecommendation" AS ENUM ('STRONG_YES', 'YES', 'NEUTRAL', 'NO', 'STRONG_NO');

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
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL,
    "public_token" VARCHAR(32) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "position_applied" VARCHAR(150) NOT NULL,
    "years_experience" DECIMAL(4,1),
    "current_company" VARCHAR(150),
    "notice_period" VARCHAR(50),
    "current_salary" DECIMAL(12,2),
    "expected_salary" DECIMAL(12,2),
    "linkedin_url" VARCHAR(255),
    "github_url" VARCHAR(255),
    "portfolio_url" VARCHAR(255),
    "personal_website_url" VARCHAR(255),
    "status" "CandidateStatus" NOT NULL DEFAULT 'APPLIED',
    "public_link_enabled" BOOLEAN NOT NULL DEFAULT true,
    "interview_date" DATE,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_skill_map" (
    "candidate_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "candidate_skill_map_pkey" PRIMARY KEY ("candidate_id","skill_id")
);

-- CreateTable
CREATE TABLE "candidate_notes" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "note_type" "NoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "visible_to_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_timeline" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "owner_type" "OwnerType" NOT NULL,
    "owner_id" UUID NOT NULL,
    "doc_type" "DocType" NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "employee_code" VARCHAR(30) NOT NULL,
    "candidate_id" UUID,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "department_id" UUID NOT NULL,
    "designation_id" UUID NOT NULL,
    "manager_id" UUID,
    "joining_date" DATE NOT NULL,
    "employment_status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "emergency_contact_name" VARCHAR(150),
    "emergency_contact_relationship" VARCHAR(50),
    "emergency_contact_phone" VARCHAR(20),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "reference_type" "ReferenceType" NOT NULL,
    "reference_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_access_log" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "accessed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),

    CONSTRAINT "public_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile" (
    "id" UUID NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "logo_url" VARCHAR(500),
    "address" VARCHAR(255),

    CONSTRAINT "company_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "stage_type" "StageType" NOT NULL,
    "is_eliminatory" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_openings" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "department_id" UUID NOT NULL,
    "designation_id" UUID,
    "template_id" UUID NOT NULL,
    "description" TEXT,
    "vacancies" INTEGER NOT NULL DEFAULT 1,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ,

    CONSTRAINT "job_openings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_applications" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "job_opening_id" UUID NOT NULL,
    "current_stage_id" UUID,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'IN_PIPELINE',
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_progress" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "status" "StageProgressStatus" NOT NULL DEFAULT 'PENDING',
    "decision" "StageDecision" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "entered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "moved_by" UUID,

    CONSTRAINT "stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" UUID NOT NULL,
    "stage_progress_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMPTZ,
    "submission_url" TEXT,
    "submission_notes" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "evaluator_id" UUID,
    "evaluator_remarks" TEXT,
    "score" INTEGER,
    "evaluated_at" TIMESTAMPTZ,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_rounds" (
    "id" UUID NOT NULL,
    "stage_progress_id" UUID NOT NULL,
    "interviewer_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "meeting_link" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "rating" INTEGER,
    "remarks" TEXT,
    "recommendation" "InterviewRecommendation",
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "interview_rounds_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_public_token_key" ON "candidates"("public_token");

-- CreateIndex
CREATE INDEX "candidates_status_idx" ON "candidates"("status");

-- CreateIndex
CREATE INDEX "candidates_position_applied_idx" ON "candidates"("position_applied");

-- CreateIndex
CREATE INDEX "candidates_created_at_idx" ON "candidates"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_candidates_email_position" ON "candidates"("email", "position_applied");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "candidate_skill_map_skill_id_idx" ON "candidate_skill_map"("skill_id");

-- CreateIndex
CREATE INDEX "candidate_notes_candidate_id_idx" ON "candidate_notes"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_timeline_candidate_id_idx" ON "candidate_timeline"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_timeline_created_at_idx" ON "candidate_timeline"("created_at");

-- CreateIndex
CREATE INDEX "idx_documents_owner" ON "documents"("owner_type", "owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "designations_name_key" ON "designations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_candidate_id_key" ON "employees"("candidate_id");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_employment_status_idx" ON "employees"("employment_status");

-- CreateIndex
CREATE INDEX "employees_manager_id_idx" ON "employees"("manager_id");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "public_access_log_candidate_id_idx" ON "public_access_log"("candidate_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "pipeline_stages_template_id_idx" ON "pipeline_stages"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_template_id_stage_order_key" ON "pipeline_stages"("template_id", "stage_order");

-- CreateIndex
CREATE INDEX "job_openings_status_idx" ON "job_openings"("status");

-- CreateIndex
CREATE INDEX "job_openings_department_id_idx" ON "job_openings"("department_id");

-- CreateIndex
CREATE INDEX "job_openings_created_at_idx" ON "job_openings"("created_at" DESC);

-- CreateIndex
CREATE INDEX "candidate_applications_job_opening_id_idx" ON "candidate_applications"("job_opening_id");

-- CreateIndex
CREATE INDEX "candidate_applications_status_idx" ON "candidate_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_applications_candidate_id_job_opening_id_key" ON "candidate_applications"("candidate_id", "job_opening_id");

-- CreateIndex
CREATE INDEX "stage_progress_application_id_idx" ON "stage_progress"("application_id");

-- CreateIndex
CREATE INDEX "stage_progress_stage_id_idx" ON "stage_progress"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "stage_progress_application_id_stage_id_key" ON "stage_progress"("application_id", "stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_stage_progress_id_key" ON "task_assignments"("stage_progress_id");

-- CreateIndex
CREATE INDEX "interview_rounds_stage_progress_id_idx" ON "interview_rounds"("stage_progress_id");

-- CreateIndex
CREATE INDEX "interview_rounds_interviewer_id_idx" ON "interview_rounds"("interviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_users_email_key" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_users_email_idx" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_otps_user_id_purpose_idx" ON "portal_otps"("user_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "portal_profiles_user_id_key" ON "portal_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_job_applications_short_id_key" ON "portal_job_applications"("short_id");

-- CreateIndex
CREATE INDEX "portal_job_applications_user_id_idx" ON "portal_job_applications"("user_id");

-- CreateIndex
CREATE INDEX "portal_employment_history_profile_id_idx" ON "portal_employment_history"("profile_id");

-- CreateIndex
CREATE INDEX "portal_education_history_profile_id_idx" ON "portal_education_history"("profile_id");

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skill_map" ADD CONSTRAINT "candidate_skill_map_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skill_map" ADD CONSTRAINT "candidate_skill_map_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_notes" ADD CONSTRAINT "candidate_notes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_notes" ADD CONSTRAINT "candidate_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_timeline" ADD CONSTRAINT "candidate_timeline_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_timeline" ADD CONSTRAINT "candidate_timeline_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "fk_documents_candidate" FOREIGN KEY ("owner_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_access_log" ADD CONSTRAINT "public_access_log_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_templates" ADD CONSTRAINT "pipeline_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "pipeline_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "pipeline_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_applications" ADD CONSTRAINT "candidate_applications_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "candidate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_moved_by_fkey" FOREIGN KEY ("moved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_stage_progress_id_fkey" FOREIGN KEY ("stage_progress_id") REFERENCES "stage_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_stage_progress_id_fkey" FOREIGN KEY ("stage_progress_id") REFERENCES "stage_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_otps" ADD CONSTRAINT "portal_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_profiles" ADD CONSTRAINT "portal_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_job_applications" ADD CONSTRAINT "portal_job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_employment_history" ADD CONSTRAINT "portal_employment_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "portal_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_education_history" ADD CONSTRAINT "portal_education_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "portal_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

