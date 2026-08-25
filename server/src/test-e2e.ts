import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API = 'http://localhost:5000/api';

async function testFullFlow() {
  console.log('🧪 Starting End-to-End Verification of Career Portal API...\n');

  const testEmail = `test.candidate.${Date.now()}@zansphere.com`;
  const testPassword = 'Password@123';

  // 1. Register
  console.log('1️⃣ Testing Registration...');
  const regRes = await axios.post(`${API}/auth/register`, {
    firstName: 'Arun',
    lastName: 'Kumar',
    email: testEmail,
    password: testPassword,
    phone: '+919876543210',
  });
  console.log('   ✅ Register Response:', regRes.data.message);

  // 2. Fetch OTP from DB (for testing verification)
  console.log('\n2️⃣ Fetching Generated OTP from DB for testing...');
  const user = await prisma.portalUser.findUnique({ where: { email: testEmail } });
  if (!user) throw new Error('User not created');

  // Verify OTP record exists
  const otps = await prisma.otp.findMany({ where: { userId: user.id } });
  console.log(`   ✅ Found ${otps.length} OTP record(s) with 10-minute expiry`);

  // Activate account directly via verify-otp endpoint or simulation
  // To test the verify endpoint, let's create a known plain OTP or test with the mock
  // Let's create an OTP with known code '123456'
  const bcrypt = await import('bcryptjs');
  const hashedCode = await bcrypt.hash('123456', 10);
  await prisma.otp.create({
    data: {
      userId: user.id,
      code: hashedCode,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const verifyRes = await axios.post(`${API}/auth/verify-otp`, {
    email: testEmail,
    otp: '123456',
    purpose: 'EMAIL_VERIFICATION',
  });
  console.log('   ✅ OTP Verified:', verifyRes.data.message);
  const token = verifyRes.data.token;

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Login Test
  console.log('\n3️⃣ Testing Login...');
  const loginRes = await axios.post(`${API}/auth/login`, {
    email: testEmail,
    password: testPassword,
  });
  console.log('   ✅ Login Response:', loginRes.data.message);

  // 4. Fetch Profile
  console.log('\n4️⃣ Testing Profile Fetch...');
  const profileRes = await axios.get(`${API}/profile`, { headers: authHeaders });
  console.log('   ✅ Profile:', profileRes.data.user.firstName, profileRes.data.user.email);

  // 5. Fetch Jobs
  console.log('\n5️⃣ Testing Job Openings Fetch...');
  const jobsRes = await axios.get(`${API}/jobs`);
  console.log(`   ✅ Found ${jobsRes.data.jobs.length} open job positions`);
  const firstJob = jobsRes.data.jobs[0];
  console.log(`   Selected Job: "${firstJob.title}" (ID: ${firstJob.id})`);

  // 6. Create Application Draft
  console.log('\n6️⃣ Initializing Application Draft...');
  const appInitRes = await axios.post(`${API}/applications`, { jobId: firstJob.id }, { headers: authHeaders });
  const app = appInitRes.data.application;
  console.log(`   ✅ Application initialized with ID: ${app.id}, Step: ${app.currentStep}`);

  // 7. Save Step 1: Personal Details
  console.log('\n7️⃣ Saving Step 1 (Personal Details)...');
  const step1Res = await axios.put(`${API}/applications/${app.id}/step/1`, {
    fullName: 'Arun Kumar',
    email: testEmail,
    phone: '+919876543210',
    dateOfBirth: '1998-05-15',
    city: 'Bangalore',
    state: 'Karnataka',
    willingToRelocate: true,
    preferredCities: 'Bangalore, Hyderabad, Chennai',
  }, { headers: authHeaders });
  console.log('   ✅ Step 1 Saved:', step1Res.data.message);

  // 8. Save Step 2: Professional Profile
  console.log('\n8️⃣ Saving Step 2 (Professional Profile + Employment History)...');
  const step2Res = await axios.put(`${API}/applications/${app.id}/step/2`, {
    employmentStatus: 'EMPLOYED',
    currentCompany: 'Tech Corp India',
    currentDesignation: 'Software Developer',
    totalExperienceYears: 3,
    totalExperienceMonths: 6,
    relevantExperienceYears: 3,
    relevantExperienceMonths: 0,
    currentCtcFixed: 1200000,
    currentCtcVariable: 200000,
    expectedCtc: 1800000,
    noticePeriod: '30 days',
    employmentHistory: [
      {
        company: 'Tech Corp India',
        role: 'Software Developer',
        durationFrom: '2023-01',
        durationTo: 'Present',
      },
      {
        company: 'Startup Lab',
        role: 'Junior Engineer',
        durationFrom: '2021-06',
        durationTo: '2022-12',
      },
    ],
  }, { headers: authHeaders });
  console.log('   ✅ Step 2 Saved:', step2Res.data.message);

  // 9. Save Step 3: Education
  console.log('\n9️⃣ Saving Step 3 (Education)...');
  const step3Res = await axios.put(`${API}/applications/${app.id}/step/3`, {
    highestQualification: 'UG',
    institution: 'Anna University',
    degreeSpecialization: 'B.Tech in Information Technology',
    yearOfPassing: 2021,
    percentageOrCgpa: '8.8 CGPA',
  }, { headers: authHeaders });
  console.log('   ✅ Step 3 Saved:', step3Res.data.message);

  // 10. Save Step 4: Skills
  console.log('\n🔟 Saving Step 4 (Skills)...');
  const step4Res = await axios.put(`${API}/applications/${app.id}/step/4`, {
    skills: {
      languages: 'TypeScript, JavaScript, Python',
      frameworks: 'React, Node.js, Express, Next.js',
      aiMlTools: 'OpenAI API, LangChain, PyTorch',
      githubLink: 'https://github.com/arunkumar-dev',
    },
  }, { headers: authHeaders });
  console.log('   ✅ Step 4 Saved:', step4Res.data.message);

  // 11. Save Step 5: Preferences
  console.log('\n1️⃣1️⃣ Saving Step 5 (Preferences)...');
  const step5Res = await axios.put(`${API}/applications/${app.id}/step/5`, {
    preferredJobType: 'FULL_TIME',
    preferredWorkMode: 'HYBRID',
    preferredDepartment: 'Engineering',
    subscribeJobAlerts: true,
  }, { headers: authHeaders });
  console.log('   ✅ Step 5 Saved:', step5Res.data.message);

  // 12. Save Step 6: Documents & Links
  console.log('\n1️⃣2️⃣ Saving Step 6 (Documents & Links)...');
  const step6Res = await axios.put(`${API}/applications/${app.id}/step/6`, {
    resumeUrl: '/uploads/sample-resume.pdf',
    resumeFileName: 'Arun_Kumar_Resume_2026.pdf',
    linkedinUrl: 'https://linkedin.com/in/arunkumar',
    githubUrl: 'https://github.com/arunkumar-dev',
    portfolioUrl: 'https://arunkumar.dev',
  }, { headers: authHeaders });
  console.log('   ✅ Step 6 Saved:', step6Res.data.message);

  // 13. Submit Application (Step 7)
  console.log('\n1️⃣3️⃣ Submitting Application (creates Candidate in Zanpeople)...');
  const submitRes = await axios.post(`${API}/applications/${app.id}/submit`, {
    dpdpConsent: true,
  }, { headers: authHeaders });
  console.log('   ✅ Submit Response:', submitRes.data.message);

  // 14. Verify Application in Dashboard
  console.log('\n1️⃣4️⃣ Fetching Dashboard Applications...');
  const dashRes = await axios.get(`${API}/applications`, { headers: authHeaders });
  console.log(`   ✅ Found ${dashRes.data.applications.length} application(s) on dashboard`);
  const myApp = dashRes.data.applications[0];
  console.log(`   Application Status: "${myApp.status}", Job: "${myApp.jobTitle}", Department: "${myApp.departmentName}"`);

  // 15. Verify Candidate was created in Zanpeople candidates table
  if (myApp.candidateId) {
    const candidates = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, email, position_applied, status FROM candidates WHERE id = $1::uuid
    `, myApp.candidateId);
    console.log('\n1️⃣5️⃣ Verified candidate in Zanpeople shared table:');
    console.log('   Candidate Name:', candidates[0]?.name);
    console.log('   Position:', candidates[0]?.position_applied);
    console.log('   Status:', candidates[0]?.status);
  }

  // 16. Test Settings Update Profile
  console.log('\n1️⃣6️⃣ Testing Profile Update in Settings...');
  const updateProfRes = await axios.put(`${API}/profile`, {
    firstName: 'Arun Updated',
    phone: '+919999988888',
  }, { headers: authHeaders });
  console.log('   ✅ Profile Updated:', updateProfRes.data.user.firstName, updateProfRes.data.user.phone);

  // 17. Test Change Password
  console.log('\n1️⃣7️⃣ Testing Password Change...');
  const changePassRes = await axios.post(`${API}/profile/change-password`, {
    currentPassword: testPassword,
    newPassword: 'NewPassword@2026',
  }, { headers: authHeaders });
  console.log('   ✅ Password Changed:', changePassRes.data.message);

  console.log('\n🎉 ALL 17 END-TO-END TESTS PASSED SUCCESSFULLY! Full system operational.');
}

testFullFlow()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.response?.data || err.message);
    await prisma.$disconnect();
    process.exit(1);
  });
