const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  
  const code = 'standard-payment';
  const name = 'Standard Payment';
  
  const existing = await client.query("SELECT id FROM vendure.payment_method WHERE code = $1", [code]);
  
  if (existing.rows.length === 0) {
    // Create payment method
    const insert = await client.query(
      "INSERT INTO vendure.payment_method (\"createdAt\", \"updatedAt\", code, enabled, handler) VALUES (NOW(), NOW(), $1, true, $2) RETURNING id",
      [code, JSON.stringify({ code: 'dummy-payment-handler', args: [] })]
    );
    const pmId = insert.rows[0].id;
    console.log(`Created Payment Method with ID: ${pmId}`);
    
    // Assign to channel
    const channelRes = await client.query("SELECT id FROM vendure.channel LIMIT 1");
    const channelId = channelRes.rows[0].id;
    await client.query(
      "INSERT INTO vendure.payment_method_channels_channel (\"paymentMethodId\", \"channelId\") VALUES ($1, $2)",
      [pmId, channelId]
    );
    
    // Add translation
    await client.query(
      "INSERT INTO vendure.payment_method_translation (\"createdAt\", \"updatedAt\", \"languageCode\", name, description, \"baseId\") VALUES (NOW(), NOW(), 'en', $1, 'Standard payment for dev', $2)",
      [name, pmId]
    );
    
    console.log('Payment method fully setup and assigned to channel.');
  } else {
    console.log('Payment method already exists.');
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
