import { Router, Response } from 'express';
import prisma from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All application routes require authentication
router.use(authMiddleware);

// ── POST /api/applications ─ Create or get draft application ──
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    // With the new workflow, application is created at signup.
    // This route can be used to get the draft or create one if it somehow doesn't exist.
    let existing = await prisma.portalApplication.findFirst({
      where: { userId: req.userId },
      include: { employmentHistory: true },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      res.json({ application: existing, isExisting: true });
      return;
    }

    // Pre-fill from user profile
    const user = await prisma.portalUser.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const application = await prisma.portalApplication.create({
      data: {
        userId: req.userId!,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        dateOfBirth: new Date('2000-01-01'), // placeholder, user will update
        city: '',
        state: '',
        employmentStatus: 'FRESHER',
        currentCompany: '',
        currentDesignation: '',
        totalExperienceYears: 0,
        totalExperienceMonths: 0,
        relevantExperienceYears: 0,
        relevantExperienceMonths: 0,
        noticePeriod: 'Immediate',
        highestQualification: 'UG',
        institution: '',
        degreeSpecialization: '',
        yearOfPassing: new Date().getFullYear(),
        percentageOrCgpa: '',
        preferredJobType: 'FULL_TIME',
        preferredWorkMode: 'ON_SITE',
        preferredDepartment: '',
        currentStep: 1,
        status: 'DRAFT',
      },
      include: { employmentHistory: true },
    });

    res.status(201).json({ application, isExisting: false });
  } catch (err) {
    console.error('Create application error:', err);
    res.status(500).json({ error: 'Failed to create application.' });
  }
});

// ── PUT /api/applications/:id/step/:step ─ Save a step ───────
router.put('/:id/step/:step', async (req: AuthRequest, res: Response) => {
  try {
    const { id, step } = req.params;
    const stepNum = parseInt(step);

    // Verify ownership
    const app = await prisma.portalApplication.findFirst({
      where: { id, userId: req.userId },
    });

    if (!app) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    const data: any = { ...req.body };
    
    // Handle employment history separately (Step 2)
    if (stepNum === 2 && data.employmentHistory) {
      const historyEntries = data.employmentHistory;
      delete data.employmentHistory;

      // Delete existing and re-create
      await prisma.employmentHistoryEntry.deleteMany({
        where: { applicationId: id },
      });

      if (historyEntries.length > 0) {
        await prisma.employmentHistoryEntry.createMany({
          data: historyEntries.map((entry: any) => ({
            applicationId: id,
            company: entry.company,
            role: entry.role,
            durationFrom: entry.durationFrom,
            durationTo: entry.durationTo,
          })),
        });
      }
    }

    // Clean up non-model fields
    delete data.id;
    delete data.userId;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.submittedAt;
    delete data.candidateId;

    // Handle decimal fields
    if (data.currentCtcFixed !== undefined) {
      data.currentCtcFixed = data.currentCtcFixed ? parseFloat(data.currentCtcFixed) : null;
    }
    if (data.currentCtcVariable !== undefined) {
      data.currentCtcVariable = data.currentCtcVariable ? parseFloat(data.currentCtcVariable) : null;
    }
    if (data.expectedCtc !== undefined) {
      data.expectedCtc = data.expectedCtc ? parseFloat(data.expectedCtc) : null;
    }

    // Handle date field
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    // Handle numeric fields
    if (data.totalExperienceYears !== undefined) data.totalExperienceYears = parseInt(data.totalExperienceYears) || 0;
    if (data.totalExperienceMonths !== undefined) data.totalExperienceMonths = parseInt(data.totalExperienceMonths) || 0;
    if (data.relevantExperienceYears !== undefined) data.relevantExperienceYears = parseInt(data.relevantExperienceYears) || 0;
    if (data.relevantExperienceMonths !== undefined) data.relevantExperienceMonths = parseInt(data.relevantExperienceMonths) || 0;
    if (data.yearOfPassing !== undefined) data.yearOfPassing = parseInt(data.yearOfPassing) || new Date().getFullYear();

    // Update current step (only advance, don't go back)
    if (stepNum >= (app.currentStep || 1)) {
      data.currentStep = stepNum + 1;
    }

    const updated = await prisma.portalApplication.update({
      where: { id },
      data,
      include: { employmentHistory: true },
    });

    // Update Zanpeople candidates table and Profile if step 1
    if (updated.candidateId) {
      try {
        await prisma.$queryRawUnsafe(`
          UPDATE candidates SET
            city = $1, state = $2,
            years_experience = $3::numeric, current_company = $4, notice_period = $5,
            current_salary = $6::numeric, expected_salary = $7::numeric,
            linkedin_url = $8, github_url = $9, portfolio_url = $10,
            updated_at = NOW()
          WHERE id = $11::uuid
        `,
          updated.city || '',
          updated.state || '',
          (updated.totalExperienceYears || 0) + ((updated.totalExperienceMonths || 0) / 12),
          updated.currentCompany || null,
          updated.noticePeriod || 'Immediate',
          updated.currentCtcFixed ? Number(updated.currentCtcFixed) : null,
          updated.expectedCtc ? Number(updated.expectedCtc) : null,
          updated.linkedinUrl || null,
          updated.githubUrl || null,
          updated.portfolioUrl || null,
          updated.candidateId
        );
      } catch (e) {
        console.error('Failed to update Zanpeople candidate:', e);
      }
    }

    if (stepNum === 1) {
      // Sync back to Profile (User) and Candidate Name/Phone
      const parts = (updated.fullName || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      await prisma.portalUser.update({
        where: { id: req.userId },
        data: { firstName, lastName, phone: updated.phone },
      });

      if (updated.candidateId) {
        await prisma.$queryRawUnsafe(`
          UPDATE candidates 
          SET name = $1, phone = $2, updated_at = NOW()
          WHERE id = $3::uuid
        `, (updated.fullName || '').trim(), updated.phone, updated.candidateId);
      }
    }

    res.json({ message: 'Step saved successfully!', application: updated });
  } catch (err) {
    console.error('Save step error:', err);
    res.status(500).json({ error: 'Failed to save step data.' });
  }
});

// ── POST /api/applications/:id/submit ─ Submit application ───
router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const app = await prisma.portalApplication.findFirst({
      where: { id, userId: req.userId },
      include: { employmentHistory: true },
    });

    if (!app) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    if (app.status === 'SUBMITTED') {
      res.status(400).json({ error: 'Application has already been submitted.' });
      return;
    }

    // Verify consent
    if (!req.body.dpdpConsent) {
      res.status(400).json({ error: 'You must agree to the Privacy Policy to submit.' });
      return;
    }

    try {
      // Update portal application only — Zanpeople candidate stays as 'APPLIED'
      // until HR manually changes it via the Zanpeople dashboard
      await prisma.portalApplication.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          dpdpConsent: true,
        },
      });

      res.json({ message: 'Application submitted successfully! Your profile has been finalized.' });
    } catch (dbErr) {
      console.error('Candidate submission error:', dbErr);
      // Still mark as submitted even if Zanpeople integration fails
      await prisma.portalApplication.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          dpdpConsent: true,
        },
      });
      res.json({ message: 'Application submitted successfully!' });
    }
  } catch (err) {
    console.error('Submit application error:', err);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

// ── GET /api/applications ─ Get all my applications ──────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.portalApplication.findMany({
      where: { userId: req.userId },
      include: { employmentHistory: true },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Zanpeople status for each application if available
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
            jobTitle: app.roleOfInterest || 'General Application',
            departmentName: app.preferredDepartment || '',
            designationName: app.roleOfInterest || '',
            zanpeopleStatus,
          };
        } catch {
          return {
            ...app,
            jobTitle: app.roleOfInterest || 'General Application',
            departmentName: '',
            designationName: '',
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

// ── GET /api/applications/:id ─ Get single application ───────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const application = await prisma.portalApplication.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { employmentHistory: true },
    });

    if (!application) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    res.json({ application });
  } catch (err) {
    console.error('Get application error:', err);
    res.status(500).json({ error: 'Failed to fetch application.' });
  }
});

// ── PUT /api/applications/:id ─ Update submitted application ─
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const app = await prisma.portalApplication.findFirst({
      where: { id, userId: req.userId },
    });

    if (!app) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    const data: any = { ...req.body };

    // Handle employment history
    if (data.employmentHistory) {
      const historyEntries = data.employmentHistory;
      delete data.employmentHistory;

      await prisma.employmentHistoryEntry.deleteMany({
        where: { applicationId: id },
      });

      if (historyEntries.length > 0) {
        await prisma.employmentHistoryEntry.createMany({
          data: historyEntries.map((entry: any) => ({
            applicationId: id,
            company: entry.company,
            role: entry.role,
            durationFrom: entry.durationFrom,
            durationTo: entry.durationTo,
          })),
        });
      }
    }

    // Clean up
    delete data.id;
    delete data.userId;
    delete data.jobId;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.submittedAt;
    delete data.candidateId;
    delete data.status;

    // Handle type conversions
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.currentCtcFixed !== undefined) data.currentCtcFixed = data.currentCtcFixed ? parseFloat(data.currentCtcFixed) : null;
    if (data.currentCtcVariable !== undefined) data.currentCtcVariable = data.currentCtcVariable ? parseFloat(data.currentCtcVariable) : null;
    if (data.expectedCtc !== undefined) data.expectedCtc = data.expectedCtc ? parseFloat(data.expectedCtc) : null;
    if (data.totalExperienceYears !== undefined) data.totalExperienceYears = parseInt(data.totalExperienceYears) || 0;
    if (data.totalExperienceMonths !== undefined) data.totalExperienceMonths = parseInt(data.totalExperienceMonths) || 0;
    if (data.relevantExperienceYears !== undefined) data.relevantExperienceYears = parseInt(data.relevantExperienceYears) || 0;
    if (data.relevantExperienceMonths !== undefined) data.relevantExperienceMonths = parseInt(data.relevantExperienceMonths) || 0;
    if (data.yearOfPassing !== undefined) data.yearOfPassing = parseInt(data.yearOfPassing) || new Date().getFullYear();

    const updated = await prisma.portalApplication.update({
      where: { id },
      data,
      include: { employmentHistory: true },
    });

    res.json({ message: 'Application updated successfully!', application: updated });
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ error: 'Failed to update application.' });
  }
});

function generatePublicToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;
