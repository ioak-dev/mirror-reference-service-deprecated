const { gql, AuthenticationError } = require('apollo-server');
const { articleFeedbackSchema, articleFeedbackCollection } = require('./model');
const { articleSchema, articleCollection } = require('../model');
const { getCollection } = require('../../../lib/dbutils');

const typeDefs = gql`
  extend type Query {
    feedback(articleId: ID!): [Feedback]
  }

  extend type Mutation {
    addFeedback(articleId: String!, type: String!): Feedback
    removeFeedback(articleId: String!, type: String!): Feedback
  }

  type Feedback {
    id: ID!
    type: String
  }

  extend type Article {
    feedback: [Feedback]
  }
`;

const resolvers = {
  Query: {
    feedback: async (_, { articleId }, { user }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(
        210,
        articleFeedbackCollection,
        articleFeedbackSchema
      );
      return await model.find({ articleId: articleId, userId: user.userId });
    },
  },

  Article: {
    feedback: {
      resolve: async (parent, _args, { user }, info) => {
        const model = getCollection(
          210,
          articleFeedbackCollection,
          articleFeedbackSchema
        );
        return await model.find({ articleId: parent.id, userId: user.userId });
      },
    },
  },

  Mutation: {
    addFeedback: async (_, args, { user }) => {
      const model = getCollection(
        210,
        articleFeedbackCollection,
        articleFeedbackSchema
      );
      const response = await model.findOneAndUpdate(
        { articleId: args.articleId, userId: user.userId, type: args.type },
        { articleId: args.articleId, userId: user.userId, type: args.type },
        { upsert: true, new: true, rawResult: true }
      );
      if (!response.lastErrorObject.updatedExisting) {
        const articleModel = getCollection(
          210,
          articleCollection,
          articleSchema
        );
        await articleModel.findByIdAndUpdate(
          args.articleId,
          {
            $inc: { [args.type]: 1 },
          },
          { new: true }
        );
      }
      return response.value;
    },
    removeFeedback: async (_, args, { user }) => {
      const model = getCollection(
        210,
        articleFeedbackCollection,
        articleFeedbackSchema
      );
      const response = await model.findOneAndDelete(
        { articleId: args.articleId, userId: user.userId, type: args.type },
        {
          rawResult: true,
        }
      );
      if (response.lastErrorObject.n > 0) {
        const articleModel = getCollection(
          210,
          articleCollection,
          articleSchema
        );
        await articleModel.findByIdAndUpdate(
          args.articleId,
          {
            $inc: { [args.type]: -1 },
          },
          { new: true }
        );
      }
      return response.value;
    },
  },
};

module.exports = { typeDefs, resolvers };
