const { gql } = require('apollo-server');
const { assetCollection, assetSchema } = require('./model');
const { getCollection } = require('../../lib/dbutils');
const { isUnauthorized } = require('../../lib/authutils');

const typeDefs = gql`
  extend type Query {
    asset(id: ID!): Asset
    assets: [Asset]
  }

  extend type Mutation {
    updateAsset(payload: AssetPayload): Asset
  }

  input AssetPayload {
    id: String
    name: String
    description: String
    jwtPassword: String
    productionMode: Boolean
  }

  type Asset {
    id: ID!
    name: String
    description: String
    jwtPassword: String
    productionMode: Boolean
  }
`;

const resolvers = {
  Query: {
    asset: async (_, { id }, { user }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, assetCollection, assetSchema);
      return await model.findById(id);
    },
    assets: async () => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, assetCollection, assetSchema);
      return await model.find();
    },
  },

  Mutation: {
    updateAsset: async (_, args, { user }) => {
      const model = getCollection(210, assetCollection, assetSchema);
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
};

module.exports = { typeDefs, resolvers };
