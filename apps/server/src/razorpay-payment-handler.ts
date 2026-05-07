import {
    PaymentMethodHandler,
    LanguageCode,
    CreatePaymentResult,
    SettlePaymentResult,
} from '@vendure/core';
import crypto from 'crypto';

export const razorpayPaymentHandler = new PaymentMethodHandler({
    code: 'razorpay-payment',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Razorpay Payment',
        },
    ],
    args: {
        keyId: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'Key ID' }] },
        keySecret: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'Key Secret' }] },
    },
    createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult> => {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = metadata;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return {
                amount: order.totalWithTax,
                state: 'Declined' as const,
                transactionId: razorpay_payment_id || undefined,
                errorMessage: 'Missing Razorpay metadata',
            };
        }

        // Verify signature
        const shasum = crypto.createHmac('sha256', args.keySecret);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest !== razorpay_signature) {
            return {
                amount: order.totalWithTax,
                state: 'Declined' as const,
                transactionId: razorpay_payment_id,
                errorMessage: 'Invalid Razorpay signature',
            };
        }

        return {
            amount: order.totalWithTax,
            state: 'Settled' as const,
            transactionId: razorpay_payment_id,
            metadata: {
                razorpay_order_id,
                razorpay_signature,
            },
        };
    },
    settlePayment: async (ctx, order, payment, args): Promise<SettlePaymentResult> => {
        return { success: true };
    },
});
