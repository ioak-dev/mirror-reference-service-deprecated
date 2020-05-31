const { gql } = require('apollo-server');
const { categoryCollection, categorySchema } = require('./model');
const { getCollection } = require('../../lib/dbutils');
const { isUnauthorized } = require('../../lib/authutils');

const typeDefs = gql`
  extend type Query {
    category(id: ID!): Category
    categories: [Category]
  }

  extend type Mutation {
    addCategory(payload: CategoryPayload): Category
  }

  input CategoryPayload {
    id: String
    name: String
    parentCategoryId: String
  }

  extend type Article {
    category: Category
  }

  type Category {
    id: ID!
    name: String
  }
`;

const resolvers = {
  Query: {
    category: async (_, { id }, { user }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, categoryCollection, categorySchema);
      return await model.findById(id);
    },
    categories: async () => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, categoryCollection, categorySchema);
      return await model.find();
    },
  },

  Mutation: {
    addCategory: async (_, args, { user }) => {
      const model = getCollection(210, categoryCollection, categorySchema);
      if (args.payload.id) {
        return await model.findByIdAndUpdate(
          args.payload.id,
          { ...args.payload, lastModifiedAt: new Date() },
          { new: true }
        );
      } else {
        const data = new model({
          ...args.payload,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
        });
        return await data.save();
      }
    },
  },

  Article: {
    category: {
      resolve: async (parent, _args, { user }, info) => {
        if (isUnauthorized(user)) {
          return isUnauthorized(user);
        }
        const model = getCollection(210, categoryCollection, categorySchema);
        return await model.findById(parent.categoryId);
      },
    },
  },
};

module.exports = { typeDefs, resolvers };
