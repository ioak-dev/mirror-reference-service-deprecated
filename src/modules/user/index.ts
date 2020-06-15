import jwt from 'jsonwebtoken';
import { gql, AuthenticationError } from 'apollo-server';
import { userSchema, userCollection } from './model';
const { getCollection } = require('../../lib/dbutils');

const typeDefs = gql`
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

  extend type Feedback {
    user: User
  }
`;

const resolvers = {
  Feedback: {
    user: async (parent: { userId: any }) => {
      const model = getCollection(210, userCollection, userSchema);
      return await model.findById(parent.userId);
    },
  },

  Mutation: {
    createEmailAccount: async (_: any, args: any, { payload }: any) => {
      const model = getCollection(210, userCollection, userSchema);
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
