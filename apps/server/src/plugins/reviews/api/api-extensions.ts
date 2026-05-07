import { gql } from 'graphql-tag';

const commonExtensions = gql`
    type ProductReview implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        rating: Int!
        authorName: String!
        authorLocation: String
        summary: String!
        body: String
        state: String!
    }

    type ProductReviewList implements PaginatedList {
        items: [ProductReview!]!
        totalItems: Int!
    }
`;

export const shopApiExtensions = gql`
    ${commonExtensions}

    extend type Query {
        productReviews(productId: ID): ProductReviewList!
    }

    input SubmitProductReviewInput {
        productId: ID!
        rating: Int!
        authorName: String!
        authorLocation: String
        summary: String!
        body: String
    }

    extend type Mutation {
        submitProductReview(input: SubmitProductReviewInput!): ProductReview!
    }
`;

export const adminApiExtensions = gql`
    ${commonExtensions}

    extend type Query {
        productReviews(productId: ID): ProductReviewList!
    }

    input UpdateProductReviewInput {
        id: ID!
        state: String
    }

    extend type Mutation {
        updateProductReview(input: UpdateProductReviewInput!): ProductReview!
        deleteProductReview(id: ID!): Boolean!
    }
`;
