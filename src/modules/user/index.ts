import jwt from 'jsonwebtoken';
import { gql, AuthenticationError } from 'apollo-server';
import { userSchema, userCollection } from './model';
const { getCollection } = require('../../lib/dbutils');

const axios = require('axios');

const ONEAUTH_API = 'http://127.0.0.1:8020/auth/';

const typeDefs = gql`
  extend type Query {
    session(key: ID!): User
  }

  type User {
    id: ID!
    firstName: String
    lastName: String
    email: String
    token: String
  }
`;

const resolvers = {
  Query: {
    session: async (_: any, { key }: any) => {
      try {
        const response = await axios.get(
          ONEAUTH_API + '210' + '/session/' + key
        );

        if (response.status === 200) {
          const user: any = jwt.verify(response.data.token, 'jwtsecret');
          const model = getCollection(210, userCollection, userSchema);
          const data = await model.findByIdAndUpdate(
            user.userId,
            { ...user },
            { new: true, upsert: true }
          );
          if (data) {
            console.log(key);
            return {
              id: data._id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              token: response.data.token,
            };
          } else {
            return null;
          }
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
    },
  },
};

export { typeDefs, resolvers };
