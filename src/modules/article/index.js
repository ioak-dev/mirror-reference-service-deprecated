const { gql, AuthenticationError } = require('apollo-server');
const { GraphQLScalarType } = require('graphql');
const { articleSchema, articleCollection } = require('./model');
const { articleTagSchema, articleTagCollection } = require('./tag/model');
const { categorySchema, categoryCollection } = require('./category/model');
const { getCollection } = require('../../lib/dbutils');

const typeDefs = gql`
  scalar DateScalar
  extend type Query {
    article(id: ID!): Article
    articles(categoryId: ID!, pageSize: Int, pageNo: Int): ArticlePaginated
    searchArticles(text: String, pageSize: Int, pageNo: Int): ArticlePaginated
  }

  extend type Mutation {
    addArticle(payload: ArticlePayload): Article
    deleteArticle(id: ID!): Article
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
    total: Int
    results: [Article]!
  }

  type Article {
    id: ID!
    title: String
    description: String
    views: Int!
    helpful: Int!
    notHelpful: Int!
    createdAt: DateScalar
    updatedAt: DateScalar
  }

  extend type Feedback {
    article: Article
  }
  extend type Tag {
    article: Article
  }
`;

const resolvers = {
  DateScalar: new GraphQLScalarType({
    name: 'DateScalar',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(+ast.value); // ast value is always in string format
      }
      return null;
    },
  }),
  Query: {
    article: async (_, { id }, { user }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, articleCollection, articleSchema);
      response = await model.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
      );
      return response;
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
    searchArticles: async (
      _,
      { text, pageSize = 0, pageNo = 0 },
      { user, token }
    ) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      if (!text) {
        return {
          results: [],
          pageNo: 0,
          hasMore: false,
          total: 0,
        };
      }
      const model = getCollection(210, articleCollection, articleSchema);
      const res = await model
        .find({
          $or: [
            { description: { $regex: new RegExp(text, 'ig') } },
            { title: { $regex: new RegExp(text, 'ig') } },
          ],
        })
        .skip(pageNo * pageSize)
        .limit(pageSize);

      return {
        results: res,
        pageNo: res.length === pageSize ? pageNo + 1 : pageNo,
        hasMore: res.length === pageSize ? true : false,
      };
    },
  },

  Feedback: {
    article: async (parent) => {
      const model = getCollection(210, articleCollection, articleSchema);
      return await model.findById(parent.articleId);
    },
  },

  Tag: {
    article: async (parent) => {
      const model = getCollection(210, articleCollection, articleSchema);
      return await model.findById(parent.articleId);
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
        existingArticle = await model.findById(args.payload.id);
        if (existingArticle.categoryId !== args.payload.categoryId) {
          const categoryModel = getCollection(
            210,
            categoryCollection,
            categorySchema
          );
          await categoryModel.findByIdAndUpdate(
            existingArticle.categoryId,
            { $inc: { articles: -1 } },
            { new: true }
          );
          await categoryModel.findByIdAndUpdate(
            args.payload.categoryId,
            { $inc: { articles: 1 } },
            { new: true }
          );
        }
        articleResponse = await model.findByIdAndUpdate(
          args.payload.id,
          args.payload,
          { new: true }
        );
      } else {
        const data = new model(args.payload);
        articleResponse = await data.save();
        const categoryModel = getCollection(
          210,
          categoryCollection,
          categorySchema
        );
        await categoryModel.findByIdAndUpdate(
          args.payload.categoryId,
          { $inc: { articles: 1 } },
          { new: true }
        );
      }

      args.payload.addTags.forEach(async (item) => {
        const data = new tagModel({
          name: item,
          articleId: articleResponse._id,
        });
        await data.save();
      });

      args.payload.removeTags.forEach(async (item) => {
        await tagModel.deleteMany({
          articleId: articleResponse._id,
          name: item,
        });
      });

      // const categoryStat = await model.aggregate([
      //   {
      //     $group: {
      //       _id: '$categoryId',
      //       count: { $sum: 1 },
      //     },
      //   },
      // ]);

      return articleResponse;
    },
    deleteArticle: async (_, { id }, { user }) => {
      const model = getCollection(210, articleCollection, articleSchema);
      const tagModel = getCollection(
        210,
        articleTagCollection,
        articleTagSchema
      );

      const res = await model.findByIdAndDelete(id);

      await tagModel.deleteMany({
        articleId: id,
      });

      return res;
    },
  },
};

module.exports = { typeDefs, resolvers };
