import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    CurrencyCode,
    LanguageCode,
    VendureConfig,
    Asset,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import express from 'express';
import { razorpayPaymentHandler } from './razorpay-payment-handler';
import { ReviewsPlugin } from './plugins/reviews/reviews.plugin';
import { TelegramNotificationPlugin } from './plugins/telegram-notification/telegram-notification.plugin';
import { productSpecificShippingCalculator } from './plugins/shipping-calculator';
import { CustomSequentialOrderCodeStrategy } from './strategies/custom-order-code-strategy';
import { RazorpayPlugin } from './plugins/razorpay/razorpay.plugin';


const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        middleware: [
            {
                handler: express.json({
                    verify: (req: any, _res, buf) => {
                        req.rawBody = buf;
                    },
                }),
                route: 'razorpay-webhook',
            },
        ],
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        schema: 'vendure',
        // synchronize:false saves egress — schema changes are handled via migrations
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        url: process.env.DATABASE_URL,
        extra: {
            // Optimized connection pool size to prevent connection exhaustion on Supabase pooler
            max: +(process.env.DB_POOL_MAX || 10),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        },
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler, razorpayPaymentHandler],
    },
    shippingOptions: {
        shippingCalculators: [productSpecificShippingCalculator],
    },
    orderOptions: {
        orderCodeStrategy: new CustomSequentialOrderCodeStrategy(),
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {
        Product: [
            {
                name: 'priority',
                type: 'boolean',
                defaultValue: false,
                public: true,
                nullable: false,
                label: [{ languageCode: LanguageCode.en, value: 'Priority Product' }],
                description: [{ languageCode: LanguageCode.en, value: 'Pin this product to show first in product lists across the website' }],
            },
            {
                name: 'videoUrl',
                type: 'string',
                public: true,
                nullable: true,
                label: [{ languageCode: LanguageCode.en, value: 'Product Video URL' }],
                description: [{ languageCode: LanguageCode.en, value: 'Direct MP4 link or YouTube/Vimeo embed URL' }],
            },
            {
                name: 'videoAsset',
                type: 'relation',
                entity: Asset,
                public: true,
                nullable: true,
                label: [{ languageCode: LanguageCode.en, value: 'Product Video Asset' }],
                description: [{ languageCode: LanguageCode.en, value: 'Direct video upload (MP4/WebM) from Vendure Asset Server' }],
            },
        ],
        Order: [
            { name: 'preferredCourier', type: 'string', public: true, label: [{ languageCode: LanguageCode.en, value: 'Preferred Courier' }] },
            { name: 'whatsappNumber', type: 'string', public: true, label: [{ languageCode: LanguageCode.en, value: 'WhatsApp Number' }] },
            { name: 'fullAddress', type: 'string', public: true, label: [{ languageCode: LanguageCode.en, value: 'Full Address' }] },
        ],
        ProductVariant: [
            {
                name: 'normalShippingCharge',
                type: 'int',
                defaultValue: 0,
                public: true,
                nullable: false,
                ui: { component: 'currency-form-input' },
                label: [{ languageCode: LanguageCode.en, value: 'Normal Shipping Charge' }],
                description: [{ languageCode: LanguageCode.en, value: 'Per-item normal shipping charge for this variant.' }],
            },
            {
                name: 'speedShippingCharge',
                type: 'int',
                defaultValue: 0,
                public: true,
                nullable: false,
                ui: { component: 'currency-form-input' },
                label: [{ languageCode: LanguageCode.en, value: 'Speed Shipping Charge' }],
                description: [{ languageCode: LanguageCode.en, value: 'Per-item express/speed shipping charge for this variant.' }],
            },
        ],
    },
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: IS_DEV ? undefined : (process.env.ASSET_URL_PREFIX || 'https://admin.sugabramar.com/assets/'),
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({
            useDatabaseForBuffer: true,
            // Poll every 5s instead of default 200ms to reduce DB load in fallback mode
            pollInterval: 5000,
        }),
        DefaultSearchPlugin.init({
            // bufferUpdates:true batches search index writes instead of one query per change
            bufferUpdates: true,
            indexStockStatus: true,
        }),
        EmailPlugin.init({
            devMode: false as any,
            transport: {
                type: 'smtp',
                host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
                port: +(process.env.EMAIL_PORT || 587),
                secure: false as false, // Port 587 requires false (STARTTLS)
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            },
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: '"SugaBramar Orders" <orders@sugabramar.com>',
                contactUrl: 'https://sugabramar.com/contact',
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: path.join(__dirname, '../dist/dashboard'),
        }),
        ReviewsPlugin,
        TelegramNotificationPlugin,
        RazorpayPlugin,
    ],
};
