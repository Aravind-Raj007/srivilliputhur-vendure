const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  // Update channel to have INR in available currencies and as default
  await client.query("UPDATE vendure.channel SET \"availableCurrencyCodes\" = 'INR', \"defaultCurrencyCode\" = 'INR'");
  
  console.log('Updated channel currency settings: default=INR, available=INR');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
