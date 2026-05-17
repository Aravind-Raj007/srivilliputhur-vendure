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

// Dynamically generate input fields for every single state
const stateArgs: Record<string, any> = {};

INDIAN_STATES.forEach(state => {
    // Generate a safe key like "rate_AndhraPradesh"
    const key = `rate_${state.replace(/[^a-zA-Z0-9]/g, '')}`;
    stateArgs[key] = {
        type: 'int',
        ui: { component: 'currency-form-input' },
        description: [{ languageCode: LanguageCode.en, value: `Rate for ${state}` }]
    };
});

export const districtShippingCalculator = new ShippingCalculator({
    code: 'indian-shipping-calculator',
    description: [{ languageCode: LanguageCode.en, value: 'Indian State based shipping' }],
    args: {
        defaultStateRate: { 
            type: 'int', 
            ui: { component: 'currency-form-input' },
            description: [{ languageCode: LanguageCode.en, value: 'Default rate for any unconfigured state' }]
        },
        ...stateArgs // Spread the 36 state inputs here!
    },
    calculate: (ctx, order, args) => {
        const address = order.shippingAddress;
        let price = args.defaultStateRate;
        
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
                const argKey = `rate_${matchedState.replace(/[^a-zA-Z0-9]/g, '')}`;
                const stateRate = (args as any)[argKey];
                
                // If a specific rate was configured for this state (not null/undefined/0), use it
                if (stateRate !== undefined && stateRate !== null && stateRate > 0) {
                    price = stateRate;
                }
            }
        }
        
        return {
            price: price,
            priceIncludesTax: ctx.channel.pricesIncludeTax,
            taxRate: 0,
        };
    },
});
