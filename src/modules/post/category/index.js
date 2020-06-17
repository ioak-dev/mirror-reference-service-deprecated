const { gql, AuthenticationError } = require('apollo-server');
const { categoryCollection, categorySchema } = require('./model');
const { getCollection } = require('../../../lib/dbutils');
const { isUnauthorized } = require('../../../lib/authutils');

const typeDefs = gql`
  extend type Query {
    postCategory(id: ID!): PostCategory
    postCategories: [PostCategory]
  }

  extend type Mutation {
    addPostCategory(payload: PostCategoryPayload): PostCategory
  }

  input PostCategoryPayload {
    id: String
    name: String
    parentCategoryId: String
  }

  extend type Post {
    category: PostCategory
  }

  type PostCategory {
    id: ID!
    name: String
    parentCategoryId: String
    posts: Int
  }
`;

const resolvers = {
  Query: {
    postCategory: async (_, { id }, { asset, user }) => {
      if (!asset || !user) {
        return new AuthenticationError('Not authorized to access this content');
      }
      const model = getCollection(asset, categoryCollection, categorySchema);
      return await model.findById(id);
    },
    postCategories: async (_, __, { user, asset }) => {
      if (!asset || !user) {
        return new AuthenticationError('Not authorized to access this content');
      }
      const model = getCollection(asset, categoryCollection, categorySchema);
      return await model.find();
    },
  },

  Mutation: {
    addPostCategory: async (_, args, { user, asset }) => {
      if (!asset || !user) {
        return new AuthenticationError('Not authorized to access this content');
      }
      const model = getCollection(asset, categoryCollection, categorySchema);
      if (args.payload.id) {
        return await model.findByIdAndUpdate(args.payload.id, args.payload, {
          new: true,
        });
      } else {
        const data = new model(args.payload);
        return await data.save();
      }
    },
  },

  Post: {
    category: {
      resolve: async (parent, _args, { asset, user }, info) => {
        if (!asset || !user) {
          return new AuthenticationError(
            'Not authorized to access this content'
          );
        }
        const model = getCollection(asset, categoryCollection, categorySchema);
        return await model.findById(parent.categoryId);
      },
    },
  },
};

module.exports = { typeDefs, resolvers };
