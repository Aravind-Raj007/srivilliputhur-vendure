/**
 * Test the full checkout flow via Vendure Shop API using proper session management.
 */
const SHOP_API = 'http://localhost:3000/shop-api';

async function shopQuery(query, variables = {}, cookies = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (cookies) headers['Cookie'] = cookies;
  const res = await fetch(SHOP_API, {
    method: 'POST', headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  const setCookie = res.headers.get('set-cookie') || '';
  const authToken = res.headers.get('vendure-auth-token') || '';
  return { data: json.data, errors: json.errors, setCookie, authToken };
}

// Extract cookies from Set-Cookie header for next request
function extractCookies(setCookieHeader, existing = '') {
  if (!setCookieHeader) return existing;
  const parts = setCookieHeader.split(',').map(p => p.split(';')[0].trim());
  const cookieMap = {};
  // Parse existing
  existing.split(';').filter(Boolean).forEach(c => {
    const [k, v] = c.trim().split('=');
    if (k) cookieMap[k.trim()] = v?.trim() || '';
  });
  // Add new ones
  parts.forEach(p => {
    const [k, v] = p.split('=');
    if (k) cookieMap[k.trim()] = v?.trim() || '';
  });
  return Object.entries(cookieMap).map(([k,v]) => `${k}=${v}`).join('; ');
}

async function main() {
  let cookies = '';

  // 1. Get a product variant ID to add to cart
  const { data: pd, errors: pe } = await shopQuery(`
    query { products(options: { take: 1 }) { items { variants { id name } } } }
  `);
  if (pe) { console.error('Product query errors:', pe); return; }
  const variantId = pd?.products?.items?.[0]?.variants?.[0]?.id;
  console.log('Using variant ID:', variantId);

  // 2. Add to cart
  const { data: d1, setCookie: sc1, authToken: at1, errors: e1 } = await shopQuery(`
    mutation { addItemToOrder(productVariantId: "${variantId}", quantity: 1) {
      ... on Order { id code state }
      ... on ErrorResult { errorCode message }
    }}
  `, {}, cookies);
  cookies = extractCookies(sc1, cookies);
  if (at1) cookies = extractCookies(`vendure-auth-token=${at1}`, cookies);
  console.log('Add to cart:', JSON.stringify(d1?.addItemToOrder));
  console.log('Cookies so far:', cookies.substring(0, 80) + '...');

  // 3. Set shipping address
  const { data: d2, setCookie: sc2, errors: e2 } = await shopQuery(`
    mutation {
      setOrderShippingAddress(input: {
        fullName: "Test User", streetLine1: "123 Test St",
        city: "Chennai", province: "Tamil Nadu", postalCode: "600001",
        phoneNumber: "9999999999", countryCode: "IN"
      }) {
        ... on Order { id state shippingAddress { country } }
        ... on ErrorResult { errorCode message }
      }
    }
  `, {}, cookies);
  cookies = extractCookies(sc2, cookies);
  console.log('Set address:', JSON.stringify(d2?.setOrderShippingAddress));

  // 4. Check eligible shipping methods
  const { data: d3, errors: e3 } = await shopQuery(`
    query { eligibleShippingMethods { id name priceWithTax } }
  `, {}, cookies);
  console.log('Eligible shipping methods:', JSON.stringify(d3?.eligibleShippingMethods));

  // 5. Set shipping method
  if (d3?.eligibleShippingMethods?.length > 0) {
    const methodId = d3.eligibleShippingMethods[0].id;
    const { data: d4 } = await shopQuery(`
      mutation { setOrderShippingMethod(shippingMethodId: ["${methodId}"]) {
        ... on Order { id state }
        ... on ErrorResult { errorCode message }
      }}
    `, {}, cookies);
    console.log('Set shipping method:', JSON.stringify(d4?.setOrderShippingMethod));

    // 6. Transition
    const { data: d5 } = await shopQuery(`
      mutation { transitionOrderToState(state: "ArrangingPayment") {
        ... on Order { id state }
        ... on OrderStateTransitionError { errorCode message transitionError }
      }}
    `, {}, cookies);
    console.log('Transition result:', JSON.stringify(d5?.transitionOrderToState));
  } else {
    console.log('❌ NO eligible shipping methods — this is the bug!');
    // Try direct set with known ID
    const { data: d4b } = await shopQuery(`
      mutation { setOrderShippingMethod(shippingMethodId: ["1"]) {
        ... on Order { id state }
        ... on ErrorResult { errorCode message }
      }}
    `, {}, cookies);
    console.log('Force set method 1:', JSON.stringify(d4b?.setOrderShippingMethod));
    
    // Now try eligible again
    const { data: d3b } = await shopQuery(`
      query { eligibleShippingMethods { id name priceWithTax } }
    `, {}, cookies);
    console.log('Eligible after force set:', JSON.stringify(d3b?.eligibleShippingMethods));
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
});
