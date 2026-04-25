const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  const code = 'IN';
  const name = 'India';
  
  const existing = await client.query("SELECT id FROM vendure.region WHERE code = $1", [code]);
  
  if (existing.rows.length === 0) {
    // Create region (Country)
    const insert = await client.query(
      "INSERT INTO vendure.region (\"createdAt\", \"updatedAt\", code, enabled, type, discriminator) VALUES (NOW(), NOW(), $1, true, 'country', 'Country') RETURNING id",
      [code]
    );
    const regionId = insert.rows[0].id;
    console.log(`Created Region (India) with ID: ${regionId}`);
    
    // Add translation
    await client.query(
      "INSERT INTO vendure.region_translation (\"createdAt\", \"updatedAt\", \"languageCode\", name, \"baseId\") VALUES (NOW(), NOW(), 'en', $1, $2)",
      [name, regionId]
    );
    
    console.log('India region setup successfully.');
  } else {
    console.log('India region already exists.');
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
