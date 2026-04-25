const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  // Add en-IN to global settings
  await client.query("UPDATE vendure.global_settings SET \"availableLanguages\" = 'en,en-IN'");
  
  // Update channel
  await client.query("UPDATE vendure.channel SET \"availableLanguageCodes\" = 'en,en-IN', \"defaultLanguageCode\" = 'en-IN'");
  
  console.log('Updated language settings to en-IN');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
