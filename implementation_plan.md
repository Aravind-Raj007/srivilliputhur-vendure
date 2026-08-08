# State-Wise & Speed/Normal Product Specific Shipping

You asked: *"If we had every product how we can handle speed and normal shipping charges"*

Since your prices depend on **3 things** (Product, State, and Speed/Normal), here is exactly how we would handle it using the two best approaches:

## User Review Required

Please review how Speed and Normal shipping fit into the approaches. Let me know which approach you prefer to implement.

### Approach A: Custom Fields + State Multiplier (Highly Recommended)
This approach keeps your product entry simple. We keep your existing custom fields!
- **On the Product Variant**: You still have exactly two fields:
  1. `normalShippingCharge` (e.g., ₹50)
  2. `speedShippingCharge` (e.g., ₹100)
- **In Vendure Admin (Settings > Shipping Methods)**: We configure multipliers for different states.
  - **Tamil Nadu Normal**: Uses `normalShippingCharge` with multiplier `1.0` (Charge = 50 * 1.0 = ₹50)
  - **Tamil Nadu Speed**: Uses `speedShippingCharge` with multiplier `1.0` (Charge = 100 * 1.0 = ₹100)
  - **Kerala Normal**: Uses `normalShippingCharge` with multiplier `1.5` (Charge = 50 * 1.5 = ₹75)
  - **Kerala Speed**: Uses `speedShippingCharge` with multiplier `1.5` (Charge = 100 * 1.5 = ₹150)
- **Why this is best**: You don't have to type state names on every single product. You just enter the base Normal and Speed prices, and the system automatically calculates the out-of-state prices based on the multipliers you set up once in the admin panel.

### Approach B: JSON Text Field (Arbitrary Prices)
If a multiplier formula (like 1.5x) doesn't work for you, and you need to manually type exact, random prices for *every state and every speed* on *every product*.
- **On the Product Variant**: We remove the old fields and create one `stateShippingCharges` text field.
- **How it works**: You must type a complex JSON object for every product:
  ```json
  {
    "Tamil Nadu": { "normal": 50, "speed": 100 },
    "Kerala": { "normal": 70, "speed": 150 },
    "Maharashtra": { "normal": 100, "speed": 250 }
  }
  ```
- **Why this is hard**: If you have 30 states, typing this block of text for every single product variant will take a lot of time and is easy to make a typo.

---

> [!IMPORTANT]
> **Conclusion & Decision**
> **Approach A** is the industry standard for this scenario. It keeps data entry on products fast, while still giving you state-wise differences.
> 
> Should we proceed with **Approach A (Multipliers)** or **Approach B (JSON Text)**?
