// Test the Vendure Shop API directly to check if the shipping method is eligible
const fetch = require('node-fetch');

async function main() {
  // First get an active session
  const res1 = await fetch('http://localhost:3000/shop-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation { 
          addItemToOrder(productVariantId: 1, quantity: 1) { 
            ... on Order { id code state } 
            ... on ErrorResult { errorCode message }
          } 
        }
      `
    })
  });
  const sessionCookie = res1.headers.get('set-cookie');
  const token = res1.headers.get('vendure-auth-token');
  console.log('Session cookie:', sessionCookie);
  console.log('Auth token:', token);
  const data1 = await res1.json();
  console.log('Add item result:', JSON.stringify(data1));

  const sessionHeader = sessionCookie || (token ? `session=${token}` : null);
  if (!sessionHeader) { console.log('No session!'); process.exit(1); }

  // Set a shipping address
  const res2 = await fetch('http://localhost:3000/shop-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie || '' },
    body: JSON.stringify({
      query: `
        mutation {
          setOrderShippingAddress(input: {
            fullName: "Test User"
            streetLine1: "123 Test St"
            city: "Chennai"
            province: "Tamil Nadu"
            postalCode: "600001"
            phoneNumber: "9999999999"
            countryCode: "IN"
          }) {
            ... on Order { id state shippingAddress { country } }
            ... on ErrorResult { errorCode message }
          }
        }
      `
    })
  });
  const data2 = await res2.json();
  console.log('Set address result:', JSON.stringify(data2));

  // Check eligible shipping methods
  const res3 = await fetch('http://localhost:3000/shop-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie || '' },
    body: JSON.stringify({
      query: `
        query {
          eligibleShippingMethods { id name priceWithTax }
        }
      `
    })
  });
  const data3 = await res3.json();
  console.log('Eligible shipping methods:', JSON.stringify(data3));
}

main().catch(console.error);
