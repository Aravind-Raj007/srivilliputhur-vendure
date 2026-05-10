import { bootstrap, EventBus, OrderStateTransitionEvent, RequestContextService, TransactionalConnection } from '@vendure/core';
import { config } from './vendure-config';
import 'dotenv/config';

async function testAutomatedTelegram() {
    console.log('Bootstrapping Vendure...');
    const app = await bootstrap(config);
    
    const eventBus = app.get(EventBus);
    const ctxService = app.get(RequestContextService);
    const connection = app.get(TransactionalConnection);

    const ctx = await ctxService.create({
        apiType: 'admin',
    });

    console.log('Finding a recent order...');
    const orders = await connection.getRepository(ctx, 'Order').find({
        order: { createdAt: 'DESC' },
        take: 1,
        relations: ['customer', 'lines', 'lines.productVariant'],
    });

    const order = orders[0] as any;
    
    // TEST: Different numbers for Phone and WhatsApp
    if (!order.customFields) order.customFields = {};
    order.customFields.whatsappNumber = '7094375704'; // WhatsApp
    order.customFields.preferredCourier = 'DTDC';
    
    order.shippingAddress = {
        streetLine1: '109, Meenambigari Nagar',
        city: 'Madurai',
        province: 'Tamil Nadu',
        postalCode: '625011',
        phoneNumber: '8270357871' // Actual Phone from form
    };

    console.log('Publishing OrderStateTransitionEvent...');
    eventBus.publish(new OrderStateTransitionEvent(
        'ArrangingPayment',
        'PaymentSettled',
        ctx,
        order
    ));

    await new Promise(resolve => setTimeout(resolve, 5000));
    await app.close();
    process.exit(0);
}

testAutomatedTelegram().catch(err => {
    console.error(err);
    process.exit(1);
});
