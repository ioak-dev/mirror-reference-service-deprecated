const { gql, AuthenticationError } = require('apollo-server');
const { articleTagSchema, articleTagCollection } = require('./model');
const { getCollection } = require('../../../lib/dbutils');

const typeDefs = gql`
  extend type Query {
    tags(articleId: ID!): [Tag]
  }

  type Tag {
    id: ID!
    name: String
    article: Article
  }

  extend type Article {
    tags: [Tag]
  }
`;

const resolvers = {
  Query: {
    tag: async (_, { articleId }, { user }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, articleTagCollection, articleTagSchema);
      return await model.find({ articleId: articleId });
    },
  },

  Article: {
    tags: {
      resolve: async (parent, _args, context, info) => {
        const model = getCollection(
          210,
          articleTagCollection,
          articleTagSchema
        );
        return await model.find({ articleId: parent.id });
      },
    },
  },
};

module.exports = { typeDefs, resolvers };
