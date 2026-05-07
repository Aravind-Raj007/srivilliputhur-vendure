import { Injectable } from '@nestjs/common';
import {
    ID,
    ListQueryBuilder,
    RequestContext,
    TransactionalConnection,
    Product,
    Customer,
    EntityId,
} from '@vendure/core';
import { ProductReview } from '../entities/product-review.entity';

@Injectable()
export class ProductReviewService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
    ) {}

    findAll(ctx: RequestContext, productId?: ID) {
        return this.connection.getRepository(ctx, ProductReview)
            .findAndCount({
                where: {
                    ...(productId ? { productId } : {}),
                    state: 'approved',
                },
                relations: ['product', 'customer'],
            })
            .then(([items, totalItems]) => ({
                items,
                totalItems,
            }));
    }

    findOne(ctx: RequestContext, id: ID) {
        return this.connection.getRepository(ctx, ProductReview).findOne({
            where: { id },
            relations: ['product', 'customer'],
        });
    }

    async create(ctx: RequestContext, input: any) {
        const review = new ProductReview(input);
        const product = await this.connection.getEntityOrThrow(ctx, Product, input.productId);
        review.product = product;
        if (ctx.activeUserId) {
            const customer = await this.connection.getRepository(ctx, Customer).findOne({
                where: { user: { id: ctx.activeUserId } },
            });
            if (customer) {
                review.customer = customer;
                review.authorName = review.authorName || `${customer.firstName} ${customer.lastName}`;
            }
        }
        // Auto-approve in dev or simple setup, but usually starts as 'new'
        review.state = 'approved'; 
        return this.connection.getRepository(ctx, ProductReview).save(review);
    }

    async update(ctx: RequestContext, input: any) {
        const review = await this.connection.getEntityOrThrow(ctx, ProductReview, input.id);
        const updatedReview = { ...review, ...input };
        return this.connection.getRepository(ctx, ProductReview).save(updatedReview);
    }

    async delete(ctx: RequestContext, id: ID) {
        const review = await this.connection.getEntityOrThrow(ctx, ProductReview, id);
        await this.connection.getRepository(ctx, ProductReview).remove(review);
        return true;
    }
}
