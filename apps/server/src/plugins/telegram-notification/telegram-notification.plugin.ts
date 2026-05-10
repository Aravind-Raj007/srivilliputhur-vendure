import { OnApplicationBootstrap } from '@nestjs/common';
import { EventBus, OrderStateTransitionEvent, PluginCommonModule, VendurePlugin, OrderService, Order } from '@vendure/core';
import { filter } from 'rxjs/operators';
import PDFDocument from 'pdfkit';

@VendurePlugin({
    imports: [PluginCommonModule],
})
export class TelegramNotificationPlugin implements OnApplicationBootstrap {
    constructor(private eventBus: EventBus, private orderService: OrderService) {}

    async onApplicationBootstrap() {
        this.eventBus.ofType(OrderStateTransitionEvent).pipe(
            filter(event => event.toState === 'PaymentSettled'),
        ).subscribe(async (event) => {
            const { ctx, order } = event;
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;

            if (!botToken || !chatId) {
                console.warn('Telegram Notification Plugin: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
                return;
            }

            // Ensure relations are loaded
            const fullOrder = await this.orderService.findOne(ctx, order.id, [
                'lines',
                'lines.productVariant',
                'customer',
                'shippingLines',
                'shippingLines.shippingMethod',
            ]);

            if (!fullOrder) {
                console.error(`Telegram Notification Plugin: Could not find order with ID ${order.id}`);
                return;
            }

            // 1. Send Text Message
            await this.sendTextMessage(botToken, chatId, fullOrder);

            // 2. Generate and Send PDF Label
            try {
                const pdfBuffer = await this.generateShippingLabel(fullOrder);
                await this.sendTelegramDocument(botToken, chatId, pdfBuffer, `Label-${fullOrder.code}.pdf`, `Shipping Label for ${fullOrder.code}`);
            } catch (error) {
                console.error('Telegram Notification Plugin: PDF Generation/Sending failed', error);
            }
        });
    }

    private async sendTextMessage(botToken: string, chatId: string, order: any) {
        const items = order.lines.map((line: any) => `• ${line.productVariant.name} x ${line.quantity}`).join('\n');
        const total = (order.totalWithTax / 100).toFixed(2);
        const currency = order.currencyCode;
        const customerName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest';
        const whatsapp = order.customFields?.whatsappNumber || 'N/A';
        const phone = order.shippingAddress?.phoneNumber || order.customer?.phoneNumber || (whatsapp !== 'N/A' ? whatsapp : 'N/A');



        const shippingAddress = order.shippingAddress;
        const addressText = shippingAddress?.streetLine1 
            ? `${shippingAddress.streetLine1}${shippingAddress.streetLine2 ? `, ${shippingAddress.streetLine2}` : ''}\n${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postalCode}`
            : (order.customFields?.fullAddress || 'N/A');

        const message = `
📦 *New Order Received!*
--------------------------
*Order Code:* \`${order.code}\`
*Customer:* ${customerName}
*Phone:* ${phone}
*WhatsApp:* ${whatsapp}
*Total:* ${total} ${currency}
*Preferred Courier:* ${order.customFields?.preferredCourier || 'N/A'}


*Items:*
${items}

*Shipping Address:*
${addressText}
--------------------------
View in Admin: ${process.env.ADMIN_URL || 'https://admin.sugabramar.com'}/admin/orders/${order.id}
        `.trim();


        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });
        if (response.ok) {
            console.log(`Telegram text notification sent for order ${order.code}`);
        }
    }


    private async generateShippingLabel(order: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ 
                size: [400, 260],
                margin: 0,
                autoFirstPage: true
            });
            const chunks: any[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Border and divider
            doc.lineWidth(1);
            doc.rect(10, 10, 380, 240).stroke();
            doc.moveTo(140, 10).lineTo(140, 250).stroke();

            // ---- LEFT SIDE: FROM ----
            // lineBreak:false prevents PDFKit from wrapping text and causing overlaps
            doc.fontSize(8).font('Helvetica-Bold').text('From:', 18, 22, { lineBreak: false });
            doc.fontSize(7.5).font('Helvetica');
            doc.text('Sugabramar Handmade', 18, 36, { lineBreak: false });
            doc.text('Leaf and Flower Design', 18, 48, { lineBreak: false });
            doc.text('Srivilliputhur-626 125', 18, 70, { lineBreak: false });
            doc.text('Phone: 9150424548', 18, 82, { lineBreak: false });

            // ---- RIGHT SIDE: TO ----
            const leftCol = 150;
            const rightWidth = 230;

            doc.fontSize(10).font('Helvetica-Bold').text('TO:', leftCol, 22, { lineBreak: false });

            const customerName = order.customer
                ? `${order.customer.firstName} ${order.customer.lastName}`.toUpperCase()
                : 'GUEST';
            doc.fontSize(11).font('Helvetica-Bold').text(customerName, leftCol, 38, { width: rightWidth, lineBreak: false });

            doc.fontSize(9).font('Helvetica');
            let currentY = 58;
            const addressLines = [
                order.shippingAddress?.streetLine1,
                order.shippingAddress?.city,
                order.shippingAddress?.province,
                `Pincode: ${order.shippingAddress?.postalCode}`,
                `Mobile: ${order.customer?.phoneNumber || order.customFields?.whatsappNumber || 'N/A'}`,
            ].filter(line => !!line);

            for (const line of addressLines) {
                if (currentY > 220) break;
                doc.text(line as string, leftCol, currentY, { width: rightWidth, lineBreak: false });
                currentY += 14;
            }

            // REF at bottom right
            doc.fontSize(11).font('Helvetica-Bold').text(`REF: ${order.code}`, 195, 232, { width: 185, align: 'right', lineBreak: false });

            doc.end();
        });
    }


    private async sendTelegramDocument(botToken: string, chatId: string, buffer: Buffer, filename: string, caption: string) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', caption);
        
        // In Node.js fetch, we can append a Blob for files
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
        formData.append('document', blob, filename);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Telegram sendDocument Error:', error);
        } else {
            console.log(`Telegram PDF label sent for order ${filename}`);
        }
    }

}
