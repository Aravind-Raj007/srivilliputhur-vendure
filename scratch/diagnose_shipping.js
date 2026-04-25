const ADMIN_API = 'http://localhost:3000/admin-api';
const SHOP_API = 'http://localhost:3000/shop-api';

async function query(api, q, vars = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(api, { method: 'POST', headers, body: JSON.stringify({ query: q, variables: vars }) });
  const json = await res.json();
  return { data: json.data, errors: json.errors, authToken: res.headers.get('vendure-auth-token') };
}

async function main() {
  // Admin login
  const { authToken: adminToken } = await query(ADMIN_API, `
    mutation { login(username: "superadmin", password: "superadmin") {
      ... on CurrentUser { id } ... on ErrorResult { errorCode }
    }}
  `);

  // Get shipping methods - simple query
  const { data: sm, errors: sme } = await query(ADMIN_API, `
    query {
      shippingMethods {
        totalItems
        items {
          id code name
          checker { code args { name value } }
          calculator { code args { name value } }
        }
      }
    }
  `, {}, adminToken);
  if (sme) { console.error('SM errors:', sme); return; }
  console.log('Shipping methods:', JSON.stringify(sm?.shippingMethods, null, 2));

  // Use shop API to test: add item, set address, check eligibility
  const { data: add, authToken: shopToken } = await query(SHOP_API, `
    mutation { addItemToOrder(productVariantId: "3", quantity: 1) {
      ... on Order { id state }
      ... on ErrorResult { errorCode message }
    }}
  `);
  console.log('\nAdd to cart result:', JSON.stringify(add?.addItemToOrder), '| shop token:', shopToken?.substring(0,10));

  const { data: addr } = await query(SHOP_API, `
    mutation { setOrderShippingAddress(input: {
      fullName: "Test", streetLine1: "123 St", city: "Chennai",
      province: "Tamil Nadu", postalCode: "600001", phoneNumber: "99999", countryCode: "IN"
    }) {
      ... on Order { id state }
      ... on ErrorResult { errorCode message }
    }}
  `, {}, shopToken);
  console.log('Set address result:', JSON.stringify(addr?.setOrderShippingAddress));

  const { data: el } = await query(SHOP_API, `
    query { eligibleShippingMethods { id name } }
  `, {}, shopToken);
  console.log('Eligible methods:', JSON.stringify(el?.eligibleShippingMethods));

  // Also try to manually set method 1 anyway
  const { data: setSm } = await query(SHOP_API, `
    mutation { setOrderShippingMethod(shippingMethodId: ["1"]) {
      ... on Order { id state shippingLines { shippingMethod { id name } } }
      ... on ErrorResult { errorCode message }
    }}
  `, {}, shopToken);
  console.log('Force set SM result:', JSON.stringify(setSm?.setOrderShippingMethod));

  // Now try to transition
  const { data: trans } = await query(SHOP_API, `
    mutation { transitionOrderToState(state: "ArrangingPayment") {
      ... on Order { id state }
      ... on OrderStateTransitionError { errorCode transitionError }
    }}
  `, {}, shopToken);
  console.log('Transition result:', JSON.stringify(trans?.transitionOrderToState));
}

main().catch(err => console.error('Fatal:', err.message));
