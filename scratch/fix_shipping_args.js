const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
});

async function main() {
  await client.connect();
  const query = `UPDATE vendure.shipping_method SET calculator = $1 WHERE id = 1`;
  const values = [JSON.stringify({ 
    code: 'flat-rate-shipping-calculator', 
    args: [{ name: 'rate', value: 0 }, { name: 'taxCategoryName', value: 'Standard Tax' }] 
  })];
  await client.query(query, values);
  console.log('Successfully updated shipping method calculator');
  await client.end();
}

main().catch(console.error);
