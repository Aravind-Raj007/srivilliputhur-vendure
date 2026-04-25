const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.ehwsfhnrkuxxpwfenvpo:qiqJuc-4tenqi-haqmaf@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres' });

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT o.id, o.code, o.state, 
           a."fullName", a."streetLine1", a."streetLine2", a.city, a.province, a."postalCode"
    FROM vendure.order o
    LEFT JOIN vendure.order_shipping_address_address a ON o.id = a."orderId"
    ORDER BY o."createdAt" DESC
    LIMIT 5
  `);
  console.log('Recent orders and addresses:');
  console.table(res.rows);
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
