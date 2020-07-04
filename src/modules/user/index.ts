import jwt from 'jsonwebtoken';
import { gql, AuthenticationError } from 'apollo-server';
import { userSchema, userCollection } from './model';
const { getCollection } = require('../../lib/dbutils');

const typeDefs = gql`
  extend type Query {
    users: [User]!
  }

  extend type Mutation {
    createEmailAccount(payload: UserPayload): User!
  }

  input UserPayload {
    firstName: String!
    lastName: String!
    email: String!
  }

  type User {
    id: ID!
    firstName: String
    lastName: String
    email: String
    resolver: String
  }

  extend type ArticleFeedback {
    user: User
  }
`;

const resolvers = {
  Query: {
    users: async (_: any, { email }: any, { asset, user }: any) => {
      if (!asset || !user) {
        return new AuthenticationError('Not authorized to access this content');
      }
      const model = getCollection(asset, userCollection, userSchema);
      return await model.find();
    },
  },
  ArticleFeedback: {
    user: async (parent: { userId: any }, _: any, { asset, user }: any) => {
      const model = getCollection(asset, userCollection, userSchema);
      return await model.findById(parent.userId);
    },
  },

  Mutation: {
    createEmailAccount: async (_: any, args: any, { asset, user }: any) => {
      const model = getCollection(asset, userCollection, userSchema);
      const response = await model.findOneAndUpdate(
        { email: args.payload.email, resolver: 'email' },
        { ...args.payload, resolver: 'email' },
        { upsert: true, new: true, rawResult: true }
      );
      return response.value;
    },
  },
};

export { typeDefs, resolvers };
