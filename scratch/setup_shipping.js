const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  const code = 'standard-shipping';
  const name = 'Standard Delivery';
  
  const existing = await client.query("SELECT id FROM vendure.shipping_method WHERE code = $1", [code]);
  
  if (existing.rows.length === 0) {
    // 1. Create Shipping Method
    // checker: all-orders-shipping-eligibility-checker
    // calculator: flat-rate-shipping-calculator
    const insert = await client.query(
      "INSERT INTO vendure.shipping_method (\"createdAt\", \"updatedAt\", code, checker, calculator, \"fulfillmentHandlerCode\") VALUES (NOW(), NOW(), $1, $2, $3, $4) RETURNING id",
      [
        code, 
        JSON.stringify({ code: 'all-orders-shipping-eligibility-checker', args: [] }),
        JSON.stringify({ code: 'flat-rate-shipping-calculator', args: [{ name: 'rate', value: '0' }, { name: 'taxCategoryName', value: 'Standard Tax' }] }),
        'manual-fulfillment-handler'
      ]
    );
    const smId = insert.rows[0].id;
    console.log(`Created Shipping Method with ID: ${smId}`);
    
    // 2. Assign to Channel
    const channelRes = await client.query("SELECT id FROM vendure.channel LIMIT 1");
    const channelId = channelRes.rows[0].id;
    await client.query(
      "INSERT INTO vendure.shipping_method_channels_channel (\"shippingMethodId\", \"channelId\") VALUES ($1, $2)",
      [smId, channelId]
    );
    
    // 3. Add Translation
    await client.query(
      "INSERT INTO vendure.shipping_method_translation (\"createdAt\", \"updatedAt\", \"languageCode\", name, description, \"baseId\") VALUES (NOW(), NOW(), 'en', $1, 'Standard shipping for all orders', $2)",
      [name, smId]
    );
    
    console.log('Shipping method setup successfully.');
  } else {
    console.log('Shipping method already exists.');
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
