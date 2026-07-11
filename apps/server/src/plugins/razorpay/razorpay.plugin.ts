import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { RazorpayWebhookController } from './razorpay-webhook.controller';

@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [RazorpayWebhookController],
})
export class RazorpayPlugin {}
