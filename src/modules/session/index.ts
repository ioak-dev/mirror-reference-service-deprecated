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
    session(key: ID!): UserSession
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

const oaSession = async (space: string, authKey: string) => {
  try {
    const response = await axios.get(
      `${ONEAUTH_API}/auth/${space}/session/${authKey}`
    );

    if (response.status === 200) {
      const user: any = jwt.verify(response.data.token, 'jwtsecret');
      const model = getCollection(210, userCollection, userSchema);
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

const emailSession = async (sessionId: string) => {
  const model = getCollection(210, sessionCollection, sessionSchema);
  const session = await model.findOne({ strategy: 'email', sessionId });
  if (!session) {
    return null;
  }

  const data: any = jwt.verify(session.token, 'jwtsecret');

  if (!data) {
    return null;
  }

  return {
    id: data._id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    token: session.token,
  };
};

const resolvers = {
  Query: {
    newEmailSession: async (_: any, { email }: any) => {
      const userModel = getCollection(210, userCollection, userSchema);
      const user = await userModel.findOne({ email, resolver: 'email' });
      if (user) {
        const model = getCollection(210, sessionCollection, sessionSchema);
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
    session: async (_: any, { key }: any) => {
      const keyParts = key.split(' ');
      switch (keyParts[0]) {
        case 'oa':
          return await oaSession(keyParts[1], keyParts[2]);
        case 'email':
          return await emailSession(keyParts[1]);
        case 'extern':
          console.log(keyParts);
          break;
      }
    },
  },
};

export { typeDefs, resolvers };
