import jwt from 'jsonwebtoken';
import { gql, AuthenticationError } from 'apollo-server';
import { sessionSchema, sessionCollection } from './model';
import { userSchema, userCollection } from '../user/model';
const { getCollection } = require('../../lib/dbutils');
import { v4 as uuidv4 } from 'uuid';

const axios = require('axios');

const ONEAUTH_API = process.env.ONEAUTH_API || 'http://127.0.0.1:8020';

const typeDefs = gql`
  extend type Query {
    newEmailSession(email: String!): Session
    newExternSession(token: String!, asset: String): Session
    session(key: ID!, asset: String): UserSession
  }

  type Session {
    id: ID!
    sessionId: String!
    token: String!
  }

  type UserSession {
    id: ID!
    firstName: String
    lastName: String
    email: String
    token: String
  }
`;

const oaSession = async (asset: string, space: string, authKey: string) => {
  try {
    const response = await axios.get(
      `${ONEAUTH_API}/auth/space/${space}/session/${authKey}`
    );

    if (response.status === 200) {
      const user: any = jwt.verify(response.data.token, 'jwtsecret');
      const model = getCollection(asset, userCollection, userSchema);
      const data = await model.findByIdAndUpdate(
        user.userId,
        { ...user, resolver: 'oneauth_space' },
        { new: true, upsert: true }
      );
      if (data) {
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
};

const emailOrExternSession = async (asset: string, sessionId: string) => {
  const model = getCollection(asset, sessionCollection, sessionSchema);
  const session = await model.findOne({ sessionId });
  if (!session) {
    return null;
  }

  const data: any = await jwt.verify(session.token, 'jwtsecret');

  if (!data) {
    return null;
  }

  return {
    id: data.userId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    token: session.token,
  };
};

const resolvers = {
  Query: {
    newEmailSession: async (_: any, { email }: any, { asset }: any) => {
      const userModel = getCollection(asset, userCollection, userSchema);
      const user = await userModel.findOne({ email, resolver: 'email' });
      if (user) {
        const model = getCollection(asset, sessionCollection, sessionSchema);
        return await model.create({
          sessionId: uuidv4(),
          token: jwt.sign(
            {
              userId: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              strategy: user.strategy,
            },
            'jwtsecret',
            { expiresIn: '8h' }
          ),
        });
      }
      return null;
    },
    newExternSession: async (_: any, args: any, { asset }: any) => {
      try {
        if (!args.token) {
          return null;
        }
        const data: any = jwt.verify(args.token, 'jwtsecret');
        const userModel = getCollection(
          asset || args.asset,
          userCollection,
          userSchema
        );

        const response = await userModel.findOneAndUpdate(
          { email: data.email, resolver: 'extern' },
          { ...data, resolver: 'extern' },
          { upsert: true, new: true, rawResult: true }
        );
        const user = response.value;
        if (user) {
          const model = getCollection(
            asset || args.asset,
            sessionCollection,
            sessionSchema
          );
          return await model.create({
            sessionId: uuidv4(),
            token: jwt.sign(
              {
                userId: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                strategy: user.strategy,
              },
              'jwtsecret',
              { expiresIn: '8h' }
            ),
          });
        }
        return null;
      } catch (err) {
        return null;
      }
    },
    session: async (_: any, args: any, { asset }: any) => {
      const keyParts = args.key.split(' ');
      switch (keyParts[0]) {
        case 'oa':
          return await oaSession(asset || args.asset, keyParts[1], keyParts[2]);
        case 'email':
        case 'extern':
          return await emailOrExternSession(asset || args.asset, keyParts[1]);
      }
    },
  },
};

export { typeDefs, resolvers };
