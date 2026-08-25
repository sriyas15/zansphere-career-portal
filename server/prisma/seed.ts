import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding initial departments, pipeline template, and job openings...\n');

  // 1. Ensure Departments exist
  const deptEngineering = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO departments (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'Engineering', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  const deptDesign = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO departments (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'Design', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  const deptSales = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO departments (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'Sales & Marketing', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  const deptHr = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO departments (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'HR & Operations', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  const engineeringId = deptEngineering[0]?.id;
  const designId = deptDesign[0]?.id;
  const salesId = deptSales[0]?.id;
  const hrId = deptHr[0]?.id;

  // 2. Ensure Designations exist
  const desFullstack = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO designations (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'Senior Full Stack Engineer', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  const desAiEngineer = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO designations (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'AI / ML Engineer', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  const desUiUx = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO designations (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'Lead UI/UX Designer', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  const desBde = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO designations (id, name, is_active, created_at)
    VALUES (gen_random_uuid(), 'Business Development Manager', true, NOW())
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id, name;
  `);

  // 3. Ensure a default Pipeline Template exists
  let template = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id FROM pipeline_templates WHERE is_default = true LIMIT 1;
  `);

  let templateId = template[0]?.id;
  if (!templateId) {
    const createdTemplate = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO pipeline_templates (id, name, description, is_default, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Standard Recruitment Pipeline', 'Default hiring pipeline for all roles', true, true, NOW(), NOW())
      RETURNING id;
    `);
    templateId = createdTemplate[0]?.id;
  }

  // 4. Seed Open Job Openings
  const jobsToSeed = [
    {
      title: 'Senior Full Stack Engineer (React / Node.js / AI)',
      departmentId: engineeringId,
      designationId: desFullstack[0]?.id,
      description: `We are looking for an exceptional Senior Full Stack Engineer to architect and build next-generation AI-powered cloud applications.

Key Responsibilities:
- Design and develop scalable full-stack web applications with React, Node.js, and TypeScript.
- Architect high-performance PostgreSQL / MongoDB databases and serverless architectures.
- Integrate cutting-edge LLMs and AI workflows into enterprise products.
- Collaborate with product and design teams to deliver world-class user experiences.

Requirements:
- 3+ years of professional full-stack development experience.
- Strong proficiency in TypeScript, React, Node.js/Express, and modern SQL/NoSQL databases.
- Experience with REST APIs, WebSockets, and Cloud Infrastructure (AWS / Supabase).
- Passion for clean architecture, testing, and modern UI/UX.`,
      vacancies: 3,
    },
    {
      title: 'AI / Machine Learning Engineer',
      departmentId: engineeringId,
      designationId: desAiEngineer[0]?.id,
      description: `Join Zansphere's AI research & engineering unit to build custom AI agents, fine-tune models, and develop production LLM pipelines.

Key Responsibilities:
- Build, evaluate, and deploy LLM-based agentic workflows and RAG architectures.
- Work with PyTorch, LangChain, LlamaIndex, and OpenAI/Anthropic APIs.
- Optimize inference latency and implement enterprise data pipelines.

Requirements:
- 2+ years experience in Python, PyTorch/TensorFlow, and ML workflows.
- Solid understanding of Transformer architectures, embeddings, and vector databases.
- Hands-on experience deploying ML models to production environments.`,
      vacancies: 2,
    },
    {
      title: 'Lead UI/UX Designer',
      departmentId: designId,
      designationId: desUiUx[0]?.id,
      description: `We are seeking a visionary UI/UX Designer to craft premium, minimal, and high-impact digital experiences across our software ecosystem.

Key Responsibilities:
- Design responsive design systems, interactive prototypes, and production-ready interfaces.
- Collaborate closely with frontend engineers to ensure pixel-perfect execution.
- Conduct user research and translate business requirements into intuitive journeys.

Requirements:
- Proven portfolio demonstrating high-end product design (Figma / Web design).
- Deep understanding of modern typography, contrast, glassmorphism, and micro-interactions.
- Experience with design tokens, component libraries, and responsive mobile-first design.`,
      vacancies: 1,
    },
    {
      title: 'Business Development Manager — Enterprise AI',
      departmentId: salesId,
      designationId: desBde[0]?.id,
      description: `Drive revenue growth and enterprise partnerships for Zansphere's custom software and AI consulting services.

Key Responsibilities:
- Identify and engage enterprise clients across India and global markets.
- Present product demos, proposals, and manage end-to-end sales cycles.
- Manage CRM pipelines and build long-term client relationships.

Requirements:
- 2+ years of B2B/Enterprise software or IT services sales experience.
- Excellent communication, presentation, and negotiation skills.
- Familiarity with CRM systems (HubSpot, Salesforce, Zoho).`,
      vacancies: 2,
    },
  ];

  for (const job of jobsToSeed) {
    if (job.departmentId && templateId) {
      await prisma.$queryRawUnsafe(`
        INSERT INTO job_openings (id, title, department_id, designation_id, template_id, description, vacancies, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2::uuid, $3::uuid, $4::uuid, $5, $6, 'OPEN', NOW(), NOW())
      `, job.title, job.departmentId, job.designationId, templateId, job.description, job.vacancies);
    }
  }

  console.log('✅ Seeded 4 open job listings with departments and designations successfully!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
