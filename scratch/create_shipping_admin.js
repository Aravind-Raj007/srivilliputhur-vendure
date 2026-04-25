/**
 * Creates a shipping method via the Vendure Admin API.
 * Run this once to properly register it in Vendure's runtime.
 */
const ADMIN_API = 'http://localhost:3000/admin-api';

async function adminQuery(query, variables = {}, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(ADMIN_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return { data: json.data, authToken: res.headers.get('vendure-auth-token') };
}

async function main() {
  // 1. Login as admin
  const { data: loginData, authToken } = await adminQuery(`
    mutation {
      login(username: "superadmin", password: "superadmin") {
        ... on CurrentUser { id identifier }
        ... on ErrorResult { errorCode message }
      }
    }
  `);
  const token = authToken || loginData?.login?.token;
  console.log('Logged in, token:', token ? token.substring(0, 10) + '...' : 'none');

  // 2. Get channel ID
  const { data: channelData } = await adminQuery(`
    query { activeChannel { id } }
  `, {}, token);
  const channelId = channelData.activeChannel.id;
  console.log('Channel ID:', channelId);

  // 3. Check existing shipping methods
  const { data: smData } = await adminQuery(`
    query { shippingMethods { items { id code name } totalItems }  }
  `, {}, token);
  console.log('Existing shipping methods:', JSON.stringify(smData.shippingMethods));

  if (smData.shippingMethods.totalItems > 0) {
    console.log('✅ Shipping method already exists with ID:', smData.shippingMethods.items[0].id);
    return;
  }

  // 4. Create shipping method
  const { data: createData } = await adminQuery(`
    mutation CreateShippingMethod($input: CreateShippingMethodInput!) {
      createShippingMethod(input: $input) {
        id
        code
        name
      }
    }
  `, {
    input: {
      code: 'standard-shipping',
      fulfillmentHandler: 'manual-fulfillment-handler',
      checker: {
        code: 'all-orders-shipping-eligibility-checker',
        arguments: [],
      },
      calculator: {
        code: 'flat-rate-shipping-calculator',
        arguments: [
          { name: 'rate', value: '0' },
          { name: 'taxCategoryName', value: 'Standard Tax' },
        ],
      },
      translations: [
        { languageCode: 'en', name: 'Standard Delivery', description: 'Standard delivery for all orders' },
      ],
    },
  }, token);
  console.log('✅ Created shipping method:', JSON.stringify(createData.createShippingMethod));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
