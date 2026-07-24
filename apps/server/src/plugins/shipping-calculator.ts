import { ShippingCalculator, LanguageCode } from '@vendure/core';

/**
 * Product-specific shipping calculator.
 *
 * Each ProductVariant has two custom fields:
 * - normalShippingCharge (int)
 * - speedShippingCharge (int)
 *
 * Total shipping = Σ (variant.customFields[type] × line.quantity)
 *
 * The `shippingType` argument allows this calculator to be used for multiple
 * shipping methods (e.g. Standard Delivery vs. Express Delivery) in the Admin UI.
 */
export const productSpecificShippingCalculator = new ShippingCalculator({
    code: 'product-specific-shipping-calculator',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Product-Specific Shipping Calculator — charges are defined per product variant',
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
        }
    },
    calculate: (ctx, order, args) => {
        let totalShipping = 0;

        for (const line of order.lines) {
            const customFields = line.productVariant?.customFields as any;
            let variantCharge = 0;

            if (args.shippingType === 'speed') {
                variantCharge = customFields?.speedShippingCharge ?? 0;
            } else {
                // Default to normal
                variantCharge = customFields?.normalShippingCharge ?? 0;
            }

            // Multiply the per-item charge by the quantity in this line
            totalShipping += variantCharge * line.quantity;
        }

        return {
            price: totalShipping,
            priceIncludesTax: ctx.channel.pricesIncludeTax,
            taxRate: 0,
        };
    },
});
