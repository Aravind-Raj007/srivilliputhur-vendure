import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { ProductReview } from './entities/product-review.entity';
import { ProductReviewService } from './service/product-review.service';
import { ProductReviewAdminResolver, ProductReviewShopResolver } from './api/product-review.resolver';
import { adminApiExtensions, shopApiExtensions } from './api/api-extensions';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [ProductReview],
    providers: [ProductReviewService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [ProductReviewShopResolver],
    },
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [ProductReviewAdminResolver],
    },
})
export class ReviewsPlugin {}
