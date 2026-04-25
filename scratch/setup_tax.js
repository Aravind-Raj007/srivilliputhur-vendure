const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  // 1. Create a Zone if it doesn't exist
  const zoneName = 'Default Zone';
  let zoneId;
  const existingZone = await client.query("SELECT id FROM vendure.zone WHERE name = $1", [zoneName]);
  
  if (existingZone.rows.length === 0) {
    const insertZone = await client.query(
      "INSERT INTO vendure.zone (\"createdAt\", \"updatedAt\", name) VALUES (NOW(), NOW(), $1) RETURNING id",
      [zoneName]
    );
    zoneId = insertZone.rows[0].id;
    console.log(`Created Zone with ID: ${zoneId}`);
  } else {
    zoneId = existingZone.rows[0].id;
    console.log(`Using existing Zone with ID: ${zoneId}`);
  }
  
  // 2. Set this zone as defaultTaxZoneId for the channel
  await client.query("UPDATE vendure.channel SET \"defaultTaxZoneId\" = $1", [zoneId]);
  console.log(`Updated channel with defaultTaxZoneId: ${zoneId}`);
  
  // 3. (Optional) Create a default Tax Category
  const categoryName = 'Standard Tax';
  let categoryId;
  const existingCategory = await client.query("SELECT id FROM vendure.tax_category WHERE name = $1", [categoryName]);
  if (existingCategory.rows.length === 0) {
     const insertCat = await client.query(
       "INSERT INTO vendure.tax_category (\"createdAt\", \"updatedAt\", name) VALUES (NOW(), NOW(), $1) RETURNING id",
       [categoryName]
     );
     categoryId = insertCat.rows[0].id;
     console.log(`Created Tax Category with ID: ${categoryId}`);
  } else {
     categoryId = existingCategory.rows[0].id;
     console.log(`Using existing Tax Category with ID: ${categoryId}`);
  }

  // 4. (Optional) Create a Tax Rate of 0% so it doesn't error out
  const existingRate = await client.query("SELECT id FROM vendure.tax_rate WHERE name = $1", ['Zero Tax']);
  if (existingRate.rows.length === 0) {
    await client.query(
      "INSERT INTO vendure.tax_rate (\"createdAt\", \"updatedAt\", name, enabled, value, \"categoryId\", \"zoneId\") VALUES (NOW(), NOW(), $1, true, 0, $2, $3)",
      ['Zero Tax', categoryId, zoneId]
    );
    console.log('Created Zero Tax Rate');
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
