const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(`Found ${res.rows.length} tables in public schema.`);
  if (res.rows.length > 0) {
    console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
  } else {
    console.log('No tables found.');
  }
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
