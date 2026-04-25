/**
 * Delete old broken shipping method and recreate via Admin API properly.
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
  // Login
  const { authToken: token } = await adminQuery(`
    mutation { login(username: "superadmin", password: "superadmin") {
      ... on CurrentUser { id } ... on ErrorResult { errorCode }
    }}
  `);
  console.log('Admin logged in');

  // Check available shipping eligibility checkers
  const { data: meta, errors: me } = await adminQuery(`
    query {
      shippingEligibilityCheckers { code args { name type } }
      shippingCalculators { code args { name type } }
    }
  `, {}, token);
  if (me) { console.error('Meta errors:', me); return; }
  console.log('\nAvailable checkers:', JSON.stringify(meta?.shippingEligibilityCheckers, null, 2));
  console.log('\nAvailable calculators:', JSON.stringify(meta?.shippingCalculators, null, 2));

  // Delete the broken method
  const { data: del, errors: de } = await adminQuery(`
    mutation { deleteShippingMethod(id: "1") { result message } }
  `, {}, token);
  console.log('\nDeleted old method:', JSON.stringify(del?.deleteShippingMethod));

  // Recreate it properly via Admin API
  const { data: create, errors: ce } = await adminQuery(`
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
        { languageCode: 'en', name: 'Standard Delivery', description: 'Free standard delivery' },
      ],
    },
  }, token);
  if (ce) { console.error('Create errors:', JSON.stringify(ce, null, 2)); return; }
  console.log('\n✅ Created new shipping method:', JSON.stringify(create?.createShippingMethod, null, 2));
}

main().catch(err => console.error('Fatal:', err.message));
