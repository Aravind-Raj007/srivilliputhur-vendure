const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT id, code, \"defaultCurrencyCode\" FROM vendure.channel");
  console.log('Channels:');
  console.log(res.rows);
  
  if (res.rows.length > 0) {
    await client.query("UPDATE vendure.channel SET \"defaultCurrencyCode\" = 'INR'");
    console.log('Updated all channels to INR');
  }
  
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
