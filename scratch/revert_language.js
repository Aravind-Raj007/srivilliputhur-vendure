const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  // Revert language settings to 'en'
  await client.query("UPDATE vendure.global_settings SET \"availableLanguages\" = 'en'");
  await client.query("UPDATE vendure.channel SET \"availableLanguageCodes\" = 'en', \"defaultLanguageCode\" = 'en'");
  
  console.log('Reverted language settings to en');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
