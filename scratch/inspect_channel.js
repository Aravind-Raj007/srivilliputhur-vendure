const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT * FROM information_schema.columns WHERE table_schema = 'vendure' AND table_name = 'channel'");
  console.log('Channel columns:');
  console.log(res.rows.map(r => r.column_name));
  
  const channelRes = await client.query("SELECT * FROM vendure.channel");
  console.log('Channel data:');
  console.log(channelRes.rows);
  
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
