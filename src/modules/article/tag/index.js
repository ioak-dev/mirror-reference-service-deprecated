const { gql, AuthenticationError } = require('apollo-server');
const { articleTagSchema, articleTagCollection } = require('./model');
const { getCollection } = require('../../../lib/dbutils');

const typeDefs = gql`
  extend type Query {
    tagCloud: [TagCloud]
    articlesByTag(tag: String!, pageSize: Int, pageNo: Int): TagPaginated
  }

  type TagPaginated {
    pageNo: Int
    hasMore: Boolean
    total: Int
    results: [Tag]!
  }

  type TagCloud {
    name: String
    count: Int
  }

  type Tag {
    id: ID!
    name: String
  }

  extend type Article {
    tags: [Tag]
  }
`;

const resolvers = {
  Query: {
    tagCloud: async (_, __, { user }) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      const model = getCollection(210, articleTagCollection, articleTagSchema);
      return await model.aggregate([
        {
          $group: {
            _id: '$name',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            name: '$_id',
            count: '$count',
          },
        },
      ]);
    },
    articlesByTag: async (
      _,
      { tag, pageSize = 0, pageNo = 0 },
      { user, token }
    ) => {
      // if (!user) {
      //   return new AuthenticationError('Not authorized to access this content');
      // }
      if (!tag) {
        return {
          results: [],
          pageNo: 0,
          hasMore: false,
        };
      }
      const model = getCollection(210, articleTagCollection, articleTagSchema);
      const response = await model
        .find({ name: tag })
        .skip(pageNo * pageSize)
        .limit(pageSize);
      return {
        results: response,
        pageNo: response.length === pageSize ? pageNo + 1 : pageNo,
        hasMore: response.length === pageSize ? true : false,
      };
    },
    // tags: async (_, __, { user }) => {
    //   // if (!user) {
    //   //   return new AuthenticationError('Not authorized to access this content');
    //   // }
    //   const model = getCollection(210, articleTagCollection, articleTagSchema);
    //   return await model.find({});
    // },
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
