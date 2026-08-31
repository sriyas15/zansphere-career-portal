import { Router, Response } from 'express';
import prisma from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

const router = Router();
router.use(authMiddleware);

// Generate a random 8-char short ID for job applications
function generateShortId(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// ── GET /api/applications/jobs ─ Get all available jobs ──────────
router.get('/jobs', async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await prisma.$queryRawUnsafe(`
      SELECT 
        j.id, j.title, j.description, j.vacancies, j.status,
        d.name as department_name
      FROM job_openings j
      LEFT JOIN departments d ON j.department_id = d.id
      WHERE j.status = 'OPEN' AND j.title != 'General Applications'
      ORDER BY j.created_at DESC
    `);
    res.json({ jobs });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

// ── GET /api/applications ─ Get all my applications ──────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.portalJobApplication.findMany({
      where: { userId: req.userId },
      orderBy: { appliedAt: 'desc' },
    });

    // Fetch Zanpeople status for each application
    const enriched = await Promise.all(
      applications.map(async (app) => {
        try {
          let zanpeopleStatus = null;
          if (app.candidateId) {
            const statusResult: any[] = await prisma.$queryRawUnsafe(`
              SELECT status 
              FROM candidates
              WHERE id = $1::uuid
            `, app.candidateId);
            zanpeopleStatus = statusResult[0]?.status || null;
          }

          return {
            ...app,
            zanpeopleStatus,
          };
        } catch {
          return {
            ...app,
            zanpeopleStatus: null,
          };
        }
      })
    );

    res.json({ applications: enriched });
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// ── POST /api/applications/general ─ Submit a general application ──
router.post('/general', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.portalProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!profile || !profile.isComplete) {
      res.status(400).json({ error: 'Please complete your profile before applying.' });
      return;
    }

    // Check if a general application already exists for this user
    const existingApp = await prisma.portalJobApplication.findFirst({
      where: { userId: req.userId, jobId: null }
    });

    if (existingApp) {
      res.status(400).json({ error: 'You have already submitted a general application.' });
      return;
    }

    if (!profile.zanpeopleId) {
      res.status(500).json({ error: 'No Zanpeople Candidate linked to this profile.' });
      return;
    }

    const positionApplied = profile.roleOfInterest || profile.preferredDepartment || 'General Application';

    // Update existing candidate status to APPLIED
    await prisma.$executeRawUnsafe(`
      UPDATE candidates
      SET position_applied = $1, status = 'APPLIED', updated_at = NOW()
      WHERE id = $2::uuid
    `, positionApplied, profile.zanpeopleId);

    const candidateId = profile.zanpeopleId;

    // Check if "General Applications" job exists
    const genJobResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, template_id FROM job_openings WHERE title = 'General Applications' AND status = 'OPEN' LIMIT 1
    `);

    if (genJobResult.length > 0) {
      const job = genJobResult[0];

      // Check if already in candidate_applications for this job
      const existingPipelineApp: any[] = await prisma.$queryRawUnsafe(`
        SELECT id FROM candidate_applications WHERE candidate_id = $1::uuid AND job_opening_id = $2::uuid
      `, candidateId, job.id);

      if (existingPipelineApp.length === 0) {
        const firstStageResult: any[] = await prisma.$queryRawUnsafe(`
          SELECT id FROM pipeline_stages 
          WHERE template_id = $1::uuid 
          ORDER BY stage_order ASC LIMIT 1
        `, job.template_id);

        const firstStageId = firstStageResult[0]?.id;

        const pipelineApp: any[] = await prisma.$queryRawUnsafe(`
          INSERT INTO candidate_applications (id, candidate_id, job_opening_id, current_stage_id, status, applied_at, updated_at)
          VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, 'IN_PIPELINE', NOW(), NOW())
          RETURNING id
        `, candidateId, job.id, firstStageId || null);

        if (firstStageId && pipelineApp.length > 0) {
          await prisma.$queryRawUnsafe(`
            INSERT INTO stage_progress (id, application_id, stage_id, status, decision, entered_at)
            VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'IN_PROGRESS', 'PENDING', NOW())
          `, pipelineApp[0].id, firstStageId);
        }
      }
    }

    // Create Job Application locally
    const application = await prisma.portalJobApplication.create({
      data: {
        shortId: generateShortId(),
        userId: req.userId!,
        jobId: null,
        jobTitle: positionApplied,
        candidateId,
        status: 'SUBMITTED',
      }
    });

    res.status(201).json({ message: 'General application submitted successfully!', application });
  } catch (err) {
    console.error('Submit general application error:', err);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});


// ── POST /api/applications/:jobId ─ Submit to a specific job ──
router.post('/:jobId', async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;

    const profile = await prisma.portalProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!profile || !profile.isComplete) {
      res.status(400).json({ error: 'Please complete your profile before applying.' });
      return;
    }

    // Check if the job exists and is open
    const jobResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, title, template_id FROM job_openings WHERE id = $1::uuid AND status = 'OPEN'
    `, jobId);

    if (jobResult.length === 0) {
      res.status(404).json({ error: 'Job not found or is no longer open.' });
      return;
    }

    const job = jobResult[0];

    // Check if they already applied to this job
    const existingApp = await prisma.portalJobApplication.findFirst({
      where: { userId: req.userId, jobId }
    });

    if (existingApp) {
      res.status(400).json({ error: 'You have already applied for this position.' });
      return;
    }

    if (!profile.zanpeopleId) {
      res.status(500).json({ error: 'No Zanpeople Candidate linked to this profile.' });
      return;
    }

    // Update existing candidate status to APPLIED
    await prisma.$executeRawUnsafe(`
      UPDATE candidates
      SET position_applied = $1, status = 'APPLIED', updated_at = NOW()
      WHERE id = $2::uuid
    `, job.title, profile.zanpeopleId);

    const candidateId = profile.zanpeopleId;

    // Link the candidate to the job opening's pipeline
    const firstStageResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT id FROM pipeline_stages 
      WHERE template_id = $1::uuid 
      ORDER BY stage_order ASC LIMIT 1
    `, job.template_id);

    const firstStageId = firstStageResult[0]?.id;

    const pipelineApp: any[] = await prisma.$queryRawUnsafe(`
      INSERT INTO candidate_applications (id, candidate_id, job_opening_id, current_stage_id, status, applied_at, updated_at)
      VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, 'IN_PIPELINE', NOW(), NOW())
      RETURNING id
    `, candidateId, jobId, firstStageId || null);

    if (firstStageId && pipelineApp.length > 0) {
      await prisma.$queryRawUnsafe(`
        INSERT INTO stage_progress (id, application_id, stage_id, status, decision, entered_at)
        VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'IN_PROGRESS', 'PENDING', NOW())
      `, pipelineApp[0].id, firstStageId);
    }


    // Create Notification in Zanpeople
    await prisma.$executeRawUnsafe(`
      INSERT INTO notifications (id, type, message, reference_type, reference_id, is_read, created_at)
      VALUES (gen_random_uuid(), 'CANDIDATE_ADDED', $1, 'CANDIDATE', $2::uuid, false, NOW())
    `, `New application received for ${job.title} from ${profile.fullName}`, candidateId);

    // Create local Job Application record
    const application = await prisma.portalJobApplication.create({
      data: {
        shortId: generateShortId(),
        userId: req.userId!,
        jobId,
        jobTitle: job.title,
        candidateId,
        status: 'SUBMITTED',
      }
    });

    res.status(201).json({ message: 'Application submitted successfully!', application });
  } catch (err) {
    console.error('Submit application error:', err);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

export default router;
