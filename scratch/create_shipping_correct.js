/**
 * Create shipping method with correct checker and calculator codes for this Vendure version.
 */
const ADMIN_API = 'http://localhost:3000/admin-api';

async function adminQuery(q, vars = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(ADMIN_API, { method: 'POST', headers, body: JSON.stringify({ query: q, variables: vars }) });
  const json = await res.json();
  return { data: json.data, errors: json.errors, authToken: res.headers.get('vendure-auth-token') };
}

async function main() {
  const { authToken: token } = await adminQuery(`
    mutation { login(username: "superadmin", password: "superadmin") {
      ... on CurrentUser { id } ... on ErrorResult { errorCode }
    }}
  `);

  // Create with correct codes
  const { data, errors } = await adminQuery(`
    mutation CreateShippingMethod($input: CreateShippingMethodInput!) {
      createShippingMethod(input: $input) {
        id code name
        checker { code }
        calculator { code args { name value } }
      }
    }
  `, {
    input: {
      code: 'standard-shipping',
      fulfillmentHandler: 'manual-fulfillment-handler',
      checker: {
        code: 'default-shipping-eligibility-checker',
        arguments: [
          { name: 'orderMinimum', value: '0' },
        ],
      },
      calculator: {
        code: 'default-shipping-calculator',
        arguments: [
          { name: 'rate', value: '0' },
          { name: 'includesTax', value: 'exclude' },
          { name: 'taxRate', value: '0' },
        ],
      },
      translations: [
        { languageCode: 'en', name: 'Standard Delivery', description: 'Free standard delivery' },
      ],
    },
  }, token);

  if (errors) { console.error('❌ Errors:', JSON.stringify(errors, null, 2)); return; }
  console.log('✅ Created shipping method:', JSON.stringify(data?.createShippingMethod, null, 2));
}

main().catch(err => console.error('Fatal:', err.message));
