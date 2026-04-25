/**
 * Test full checkout flow using Bearer token (vendure-auth-token header).
 * Vendure supports tokenMethod: ['bearer', 'cookie'], so Bearer token alone works.
 */
const SHOP_API = 'http://localhost:3000/shop-api';

async function shopQuery(query, variables = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(SHOP_API, {
    method: 'POST', headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  const authToken = res.headers.get('vendure-auth-token') || token;
  return { data: json.data, errors: json.errors, authToken };
}

async function main() {
  let token = null;

  // 1. Get a product variant ID
  const { data: pd, errors: pe } = await shopQuery(`
    query { products(options: { take: 1 }) { items { variants { id name } } } }
  `);
  if (pe) { console.error('Product errors:', pe); return; }
  const variantId = pd?.products?.items?.[0]?.variants?.[0]?.id;
  console.log('Using variant ID:', variantId);

  // 2. Add to cart — get a token
  const { data: d1, authToken: t1 } = await shopQuery(`
    mutation { addItemToOrder(productVariantId: "${variantId}", quantity: 1) {
      ... on Order { id code state }
      ... on ErrorResult { errorCode message }
    }}
  `);
  token = t1;
  console.log('Add to cart:', JSON.stringify(d1?.addItemToOrder), '| token:', token?.substring(0,12));

  // 3. Set customer
  const { data: d1b, authToken: t1b } = await shopQuery(`
    mutation { setCustomerForOrder(input: {
      emailAddress: "test@example.com", firstName: "Test", lastName: "User"
    }) {
      ... on Order { id state }
      ... on ErrorResult { errorCode message }
    }}
  `, {}, token);
  token = t1b || token;
  console.log('Set customer:', JSON.stringify(d1b?.setCustomerForOrder));

  // 4. Set shipping address
  const { data: d2, authToken: t2 } = await shopQuery(`
    mutation {
      setOrderShippingAddress(input: {
        fullName: "Test User", streetLine1: "123 Test St",
        city: "Chennai", province: "Tamil Nadu", postalCode: "600001",
        phoneNumber: "9999999999", countryCode: "IN"
      }) {
        ... on Order { id state }
        ... on ErrorResult { errorCode message }
      }
    }
  `, {}, token);
  token = t2 || token;
  console.log('Set address:', JSON.stringify(d2?.setOrderShippingAddress));

  // 5. Check eligible shipping methods
  const { data: d3 } = await shopQuery(`
    query { eligibleShippingMethods { id name priceWithTax } }
  `, {}, token);
  console.log('Eligible shipping methods:', JSON.stringify(d3?.eligibleShippingMethods));

  if (d3?.eligibleShippingMethods?.length > 0) {
    const methodId = d3.eligibleShippingMethods[0].id;

    // 6. Set shipping method
    const { data: d4 } = await shopQuery(`
      mutation { setOrderShippingMethod(shippingMethodId: ["${methodId}"]) {
        ... on Order { id state }
        ... on ErrorResult { errorCode message }
      }}
    `, {}, token);
    console.log('Set shipping method:', JSON.stringify(d4?.setOrderShippingMethod));

    // 7. Transition to ArrangingPayment
    const { data: d5 } = await shopQuery(`
      mutation { transitionOrderToState(state: "ArrangingPayment") {
        ... on Order { id state }
        ... on OrderStateTransitionError { errorCode message transitionError }
      }}
    `, {}, token);
    console.log('Transition result:', JSON.stringify(d5?.transitionOrderToState));

    if (d5?.transitionOrderToState?.state === 'ArrangingPayment') {
      console.log('\n✅ SUCCESS! Bearer token session works end-to-end.');
      console.log('✅ The token is:', token);
    }
  } else {
    console.log('❌ NO eligible shipping methods with Bearer token either!');
  }
}

main().catch(err => { console.error('Fatal:', err.message); });
