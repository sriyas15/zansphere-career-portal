const { execSync } = require('child_process');
require('dotenv').config();

const url = process.env.DATABASE_URL;
try {
  execSync(`npx prisma migrate diff --from-url "${url}" --to-schema-datamodel prisma/schema.prisma --script > migration.sql`, { stdio: 'inherit' });
  console.log('Migration generated.');
} catch (e) {
  console.error(e);
}
