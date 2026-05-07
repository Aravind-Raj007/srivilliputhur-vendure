import { DeepPartial, VendureEntity, ID, Product, Customer } from '@vendure/core';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class ProductReview extends VendureEntity {
    constructor(input?: DeepPartial<ProductReview>) {
        super(input);
    }

    @Column()
    rating: number;

    @Column({ type: 'text', nullable: true })
    authorName: string;

    @Column({ type: 'text', nullable: true })
    authorLocation: string;

    @Column({ type: 'text' })
    summary: string;

    @Column({ type: 'text', nullable: true })
    body: string;

    @Column({ default: 'new' })
    state: 'new' | 'approved' | 'rejected';

    @ManyToOne(type => Product)
    product: Product;

    @Column()
    productId: ID;

    @ManyToOne(type => Customer, { nullable: true })
    customer: Customer;

    @Column({ nullable: true })
    customerId: ID;
}
