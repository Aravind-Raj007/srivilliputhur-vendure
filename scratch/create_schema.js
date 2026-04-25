const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  await client.query("CREATE SCHEMA IF NOT EXISTS vendure");
  console.log('Schema "vendure" created or already exists.');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
