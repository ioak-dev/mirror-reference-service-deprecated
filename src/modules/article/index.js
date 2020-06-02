const { gql, AuthenticationError } = require('apollo-server');
const { articleSchema, articleCollection } = require('./model');
const { articleTagSchema, articleTagCollection } = require('./tag/model');
const { getCollection } = require('../../lib/dbutils');

const typeDefs = gql`
  extend type Query {
    article(id: ID!): Article
    articles(categoryId: ID, pageSize: Int, pageNo: Int): ArticlePaginated
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

  type ArticlePaginated {
    pageNo: Int
    hasMore: Boolean
    results: [Article]!
  }

  type Article {
    id: ID!
    title: String
    description: String
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
    articles: async (
      _,
      { categoryId, pageSize = 0, pageNo = 0 },
      { user, token }
    ) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      if (!categoryId) {
        return {
          results: [],
          pageNo: 0,
          hasMore: false,
        };
      }
      const model = getCollection(210, articleCollection, articleSchema);
      const response = await model
        .find({ categoryId: categoryId })
        .skip(pageNo * pageSize)
        .limit(pageSize);
      return {
        results: response,
        pageNo: response.length === pageSize ? pageNo + 1 : pageNo,
        hasMore: response.length === pageSize ? true : false,
      };
    },
  },

  Mutation: {
    addArticle: async (_, args, { user }) => {
      const model = getCollection(210, articleCollection, articleSchema);
      const tagModel = getCollection(
        210,
        articleTagCollection,
        articleTagSchema
      );
      let articleResponse;
      if (args.payload.id) {
        articleResponse = await model.findByIdAndUpdate(
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
        articleResponse = await data.save();
      }

      args.payload.addTags.forEach(async (item) => {
        const data = new tagModel({
          name: item,
          articleId: articleResponse._id,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
        });
        await data.save();
      });

      args.payload.removeTags.forEach(async (item) => {
        await tagModel.deleteMany({
          articleId: articleResponse._id,
          name: item,
        });
      });

      return articleResponse;
    },
  },
};

module.exports = { typeDefs, resolvers };
