import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    CurrencyCode,
    LanguageCode,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { razorpayPaymentHandler } from './razorpay-payment-handler';
import { ReviewsPlugin } from './plugins/reviews/reviews.plugin';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
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
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: true, // Re-enabled to fix schema sync issues causing UI crash
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        url: process.env.DATABASE_URL,
        extra: {
            max: 10, // Increased to allow more concurrent requests on Supabase
        },
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler, razorpayPaymentHandler],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {
        Order: [
            { name: 'preferredCourier', type: 'string', public: true, label: [{ languageCode: LanguageCode.en, value: 'Preferred Courier' }] },
            { name: 'whatsappNumber', type: 'string', public: true, label: [{ languageCode: LanguageCode.en, value: 'WhatsApp Number' }] },
            { name: 'fullAddress', type: 'string', public: true, label: [{ languageCode: LanguageCode.en, value: 'Full Address' }] },
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
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
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
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),
        ReviewsPlugin,
    ],
};
