import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { OrderService, RequestContextService, Logger } from '@vendure/core';
import * as crypto from 'crypto';

@Controller('razorpay-webhook')
export class RazorpayWebhookController {
    constructor(
        private orderService: OrderService,
        private requestContextService: RequestContextService,
    ) {}

    @Post()
    async handleWebhook(@Req() req: Request, @Res() res: Response) {
        const signature = req.headers['x-razorpay-signature'] as string;
        const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '').trim();
        const keySecret = (process.env.RAZORPAY_KEY_SECRET || webhookSecret).trim();

        if (!signature || !webhookSecret) {
            Logger.warn('Missing Razorpay signature or secret configuration', 'RazorpayWebhook');
            return res.status(HttpStatus.BAD_REQUEST).send('Missing signature or secret');
        }

        // Verify HMAC signature using rawBody if available, with stringified fallback
        const rawBody = (req as any).rawBody;
        let isSignatureValid = false;

        if (rawBody && Buffer.isBuffer(rawBody)) {
            const expectedSig = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            if (expectedSig === signature) {
                isSignatureValid = true;
            }
        }

        if (!isSignatureValid) {
            const bodyStr = JSON.stringify(req.body);
            const expectedSigStr = crypto
                .createHmac('sha256', webhookSecret)
                .update(bodyStr)
                .digest('hex');
            if (expectedSigStr === signature) {
                isSignatureValid = true;
            }
        }

        if (!isSignatureValid) {
            Logger.warn('Invalid Razorpay webhook signature', 'RazorpayWebhook');
            return res.status(HttpStatus.BAD_REQUEST).send('Invalid signature');
        }

        const event = req.body.event;
        const payload = req.body.payload;

        Logger.info(`Received Razorpay webhook event: ${event}`, 'RazorpayWebhook');

        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payment?.entity;
            const orderEntity = payload.order?.entity;

            // We expect the orderCode in notes or receipt
            const orderCode = paymentEntity?.notes?.orderCode || orderEntity?.notes?.orderCode || orderEntity?.receipt;

            if (!orderCode) {
                Logger.error('No orderCode found in Razorpay webhook notes or receipt', 'RazorpayWebhook');
                return res.status(HttpStatus.OK).send('No orderCode found, ignored');
            }

            const razorpay_payment_id = paymentEntity?.id;
            const razorpay_order_id = paymentEntity?.order_id || orderEntity?.id;
            
            // Reconstruct the client signature so our standard `razorpayPaymentHandler` accepts it
            const expectedPaymentSignature = crypto
                .createHmac('sha256', keySecret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            try {
                // Create an admin request context
                const ctx = await this.requestContextService.create({ apiType: 'admin' });
                
                let order = await this.orderService.findOneByCode(ctx, orderCode);
                if (!order) {
                    Logger.error(`Order with code ${orderCode} not found`, 'RazorpayWebhook');
                    return res.status(HttpStatus.OK).send('Order not found');
                }

                // If order is still in AddingItems (race condition over high-latency network), transition first
                if (order.state === 'AddingItems') {
                    Logger.info(`Order ${orderCode} is in AddingItems, transitioning to ArrangingPayment before settling`, 'RazorpayWebhook');
                    const transitionResult = await this.orderService.transitionToState(ctx, order.id, 'ArrangingPayment');
                    if ('id' in transitionResult) {
                        order = transitionResult;
                    } else {
                        Logger.error(`Failed to transition order ${orderCode} to ArrangingPayment: ${transitionResult.message}`, 'RazorpayWebhook');
                    }
                }

                if (order.state === 'ArrangingPayment') {
                    Logger.info(`Adding payment to order ${orderCode} via webhook`, 'RazorpayWebhook');
                    
                    const result = await this.orderService.addPaymentToOrder(ctx, order.id, {
                        method: 'razorpay-payment',
                        metadata: {
                            razorpay_order_id,
                            razorpay_payment_id,
                            razorpay_signature: expectedPaymentSignature,
                            is_webhook: true
                        }
                    });

                    if ('id' in result) {
                        Logger.info(`Payment successfully added to order ${orderCode} via webhook. Payment ID: ${result.id}`, 'RazorpayWebhook');
                    } else {
                        Logger.error(`Failed to add payment to order ${orderCode}: ${result.message}`, 'RazorpayWebhook');
                    }
                } else {
                    Logger.info(`Order ${orderCode} is in state ${order.state}, ignoring webhook`, 'RazorpayWebhook');
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                Logger.error(`Error processing Razorpay webhook for order ${orderCode}: ${errorMessage}`, 'RazorpayWebhook');
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error processing');
            }
        }

        return res.status(HttpStatus.OK).send('OK');
    }
}
