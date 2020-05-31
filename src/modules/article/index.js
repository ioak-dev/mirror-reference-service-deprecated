const { gql, AuthenticationError } = require('apollo-server');
const { articleSchema, articleCollection } = require('./model');
const { getCollection } = require('../../lib/dbutils');

const typeDefs = gql`
  extend type Query {
    article(id: ID!): Article
    articles: [Article]
  }

  extend type Mutation {
    addArticle(payload: ArticlePayload): Article
  }

  input ArticlePayload {
    id: String
    title: String
    description: String
    categoryId: String
    addTags: [String]
    removeTags: [String]
  }

  type Article {
    id: ID!
    title: String
    description: String
    categoryId: String
  }

  extend type Category {
    articles: [Article]
  }
`;

const resolvers = {
  Query: {
    article: async (_, { id }, { user }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, articleCollection, articleSchema);
      return await model.findById(id);
    },
    articles: async (_, args, { user, token }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, articleCollection, articleSchema);
      return await model.find({});
    },
  },

  Mutation: {
    addArticle: async (_, args, { user }) => {
      const model = getCollection(210, articleCollection, articleSchema);
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

  Category: {
    articles: {
      resolve: async (parent, _args, context, info) => {
        const model = getCollection(210, articleCollection, articleSchema);
        return await model.find({ categoryId: parent.id });
      },
    },
  },
};

module.exports = { typeDefs, resolvers };
