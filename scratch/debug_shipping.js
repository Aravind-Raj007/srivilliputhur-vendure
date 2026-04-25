const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  // Check shipping method
  const sm = await client.query("SELECT * FROM vendure.shipping_method");
  console.log('Shipping Methods in DB:', JSON.stringify(sm.rows, null, 2));
  
  // Check zones
  const zones = await client.query("SELECT * FROM vendure.zone");
  console.log('Zones in DB:', JSON.stringify(zones.rows, null, 2));
  
  // Check zone members
  const members = await client.query("SELECT * FROM vendure.zone_members_region");
  console.log('Zone Members in DB:', JSON.stringify(members.rows, null, 2));
  
  // Check India
  const india = await client.query("SELECT * FROM vendure.region WHERE code = 'IN'");
  console.log('India in DB:', JSON.stringify(india.rows, null, 2));

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
