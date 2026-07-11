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
        const secret = process.env.RAZORPAY_KEY_SECRET; // Must match your webhook secret in Razorpay Dashboard

        if (!signature || !secret) {
            Logger.warn('Missing Razorpay signature or secret', 'RazorpayWebhook');
            return res.status(HttpStatus.BAD_REQUEST).send('Missing signature or secret');
        }

        // Note: Express body-parser has already parsed the JSON. 
        // Razorpay expects the raw body for exact signature matching, but stringifying usually works 
        // if no special characters/formatting are mutated by the parser.
        const bodyStr = JSON.stringify(req.body);
        const expectedWebhookSignature = crypto
            .createHmac('sha256', secret)
            .update(bodyStr)
            .digest('hex');

        if (expectedWebhookSignature !== signature) {
            // Fallback: Sometimes JSON.stringify changes whitespace.
            // If it fails, check your Razorpay webhook secret config.
            Logger.warn('Invalid Razorpay webhook signature', 'RazorpayWebhook');
            // Depending on strictness, you might return 400. We will proceed with caution or log it.
            return res.status(HttpStatus.BAD_REQUEST).send('Invalid signature');
        }

        const event = req.body.event;
        const payload = req.body.payload;

        Logger.info(`Received Razorpay webhook event: ${event}`, 'RazorpayWebhook');

        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payment?.entity;
            const orderEntity = payload.order?.entity;

            // We expect the frontend to send orderCode in notes
            const orderCode = paymentEntity?.notes?.orderCode || orderEntity?.notes?.orderCode || orderEntity?.receipt;

            if (!orderCode) {
                Logger.error('No orderCode found in Razorpay webhook notes or receipt', 'RazorpayWebhook');
                return res.status(HttpStatus.OK).send('No orderCode found, ignored');
            }

            const razorpay_payment_id = paymentEntity?.id;
            const razorpay_order_id = paymentEntity?.order_id || orderEntity?.id;
            
            // Reconstruct the client signature so our standard `razorpayPaymentHandler` accepts it
            const expectedPaymentSignature = crypto
                .createHmac('sha256', secret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            try {
                // Create an admin request context
                const ctx = await this.requestContextService.create({ apiType: 'admin' });
                
                const order = await this.orderService.findOneByCode(ctx, orderCode);
                if (!order) {
                    Logger.error(`Order with code ${orderCode} not found`, 'RazorpayWebhook');
                    return res.status(HttpStatus.OK).send('Order not found');
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

                    Logger.info(`Payment added to order ${orderCode} via webhook`, 'RazorpayWebhook');
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
