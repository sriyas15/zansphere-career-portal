const { execSync } = require('child_process');
require('dotenv').config();

const url = process.env.DATABASE_URL;
try {
  execSync(`npx prisma db execute --url "${url}" --file create_tables.sql`, { stdio: 'inherit' });
  console.log('Tables created successfully.');
} catch (e) {
  console.error(e);
}
