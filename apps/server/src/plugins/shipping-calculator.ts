import { ShippingCalculator, LanguageCode } from '@vendure/core';

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

const stateArgs: Record<string, any> = {};

INDIAN_STATES.forEach(state => {
    // Generate a safe key like "multiplier_AndhraPradesh"
    const key = `multiplier_${state.replace(/[^a-zA-Z0-9]/g, '')}`;
    stateArgs[key] = {
        type: 'float',
        ui: { component: 'number-form-input' },
        description: [{ languageCode: LanguageCode.en, value: `Multiplier for ${state} (e.g. 1.0 or 1.5)` }],
        defaultValue: 1.0
    };
});

/**
 * Product-specific shipping calculator.
 *
 * Each ProductVariant has two custom fields:
 * - normalShippingCharge (int)
 * - speedShippingCharge (int)
 *
 * Total shipping = Σ (variant.customFields[type] × line.quantity) × StateMultiplier
 */
export const productSpecificShippingCalculator = new ShippingCalculator({
    code: 'product-specific-shipping-calculator',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Indian State-wise & Per-Product Shipping Calculator — charges configured per state and/or per product variant',
        },
    ],
    args: {
        shippingType: {
            type: 'string',
            ui: { 
                component: 'select-form-input', 
                options: [
                    { value: 'normal' },
                    { value: 'speed' }
                ] 
            },
            description: [{ languageCode: LanguageCode.en, value: 'Which shipping charge to apply (Normal or Speed)' }],
            defaultValue: 'normal',
        },
        defaultMultiplier: {
            type: 'float',
            ui: { component: 'number-form-input' },
            description: [{ languageCode: LanguageCode.en, value: 'Default Multiplier for any unconfigured state' }],
            defaultValue: 1.0,
        },
        ...stateArgs
    },
    calculate: (ctx, order, args) => {
        let totalBaseShipping = 0;

        // 1. Calculate base shipping from product variants
        for (const line of order.lines) {
            const customFields = line.productVariant?.customFields as any;
            let variantCharge = 0;

            if (args.shippingType === 'speed') {
                variantCharge = customFields?.speedShippingCharge ?? 0;
            } else {
                variantCharge = customFields?.normalShippingCharge ?? 0;
            }

            totalBaseShipping += variantCharge * line.quantity;
        }

        // 2. Find the applicable state multiplier
        let activeMultiplier = args.defaultMultiplier ?? 1.0;
        
        const address = order.shippingAddress;
        const province = address?.province?.trim().toLowerCase();
        
        if (province) {
            // Apply standard state abbreviations mapping
            let normalizedProvince = province;
            if (province === 'tn') normalizedProvince = 'tamil nadu';
            else if (province === 'ap') normalizedProvince = 'andhra pradesh';
            else if (province === 'kl') normalizedProvince = 'kerala';
            else if (province === 'ka') normalizedProvince = 'karnataka';
            else if (province === 'mh') normalizedProvince = 'maharashtra';
            else if (province === 'dl') normalizedProvince = 'delhi';
            else if (province === 'ts' || province === 'tg') normalizedProvince = 'telangana';
            else if (province === 'wb') normalizedProvince = 'west bengal';
            else if (province === 'up') normalizedProvince = 'uttar pradesh';

            // Find matching state from our list
            const matchedState = INDIAN_STATES.find(s => 
                s.toLowerCase() === normalizedProvince || 
                s.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedProvince.replace(/[^a-z0-9]/g, '')
            );

            if (matchedState) {
                const argKey = `multiplier_${matchedState.replace(/[^a-zA-Z0-9]/g, '')}`;
                const stateMultiplier = (args as any)[argKey];
                
                // If a specific multiplier was configured for this state, use it
                if (stateMultiplier !== undefined && stateMultiplier !== null) {
                    activeMultiplier = stateMultiplier;
                }
            }
        }

        return {
            price: Math.round(totalBaseShipping * activeMultiplier),
            priceIncludesTax: ctx.channel.pricesIncludeTax,
            taxRate: 0,
        };
    },
});
