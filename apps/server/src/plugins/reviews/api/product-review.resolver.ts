import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, ID } from '@vendure/core';
import { ProductReviewService } from '../service/product-review.service';

@Resolver()
export class ProductReviewShopResolver {
    constructor(private productReviewService: ProductReviewService) {}

    @Query()
    productReviews(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.productReviewService.findAll(ctx, args.productId);
    }

    @Mutation()
    submitProductReview(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.productReviewService.create(ctx, args.input);
    }
}

@Resolver()
export class ProductReviewAdminResolver {
    constructor(private productReviewService: ProductReviewService) {}

    @Query()
    productReviews(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.productReviewService.findAll(ctx, args.productId);
    }

    @Mutation()
    updateProductReview(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.productReviewService.update(ctx, args.input);
    }

    @Mutation()
    deleteProductReview(@Ctx() ctx: RequestContext, @Args() args: any) {
        return this.productReviewService.delete(ctx, args.id);
    }
}
