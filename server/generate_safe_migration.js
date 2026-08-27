const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const url = process.env.DATABASE_URL;
try {
  execSync(`npx prisma migrate diff --from-url "${url}" --to-schema-datamodel prisma/schema.prisma --script > diff.sql`, { stdio: 'inherit' });
  let sql = fs.readFileSync('diff.sql', 'utf8');
  
  const lines = sql.split('\n');
  const safeLines = lines.map(line => {
    if (line.startsWith('DROP TABLE') && !line.includes('portal_')) {
       return '-- ' + line;
    }
    if (line.startsWith('DROP TYPE') && !line.includes('Portal')) {
       return '-- ' + line;
    }
    return line;
  });

  fs.writeFileSync('diff_safe.sql', safeLines.join('\n'));
  console.log('Safe diff generated to diff_safe.sql');
} catch (e) {
  console.error(e);
}
