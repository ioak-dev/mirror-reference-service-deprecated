const { gql, AuthenticationError } = require('apollo-server');
const { postCommentSchema, postCommentCollection } = require('./model');
const { postSchema, postCollection } = require('../model');
const { getCollection } = require('../../../lib/dbutils');

const typeDefs = gql`
  extend type Query {
    postComments(
      postId: String!
      pageSize: Int
      pageNo: Int
    ): PostCommentPaginated
  }

  extend type Mutation {
    updatePostComment(payload: PostCommentPayload!): PostComment
  }

  type PostCommentPaginated {
    pageNo: Int
    hasMore: Boolean
    total: Int
    results: [PostComment]!
  }

  input PostCommentPayload {
    id: ID
    text: String
    parentId: String
    postId: String!
  }

  type PostComment {
    id: ID!
    text: String
    parentId: String
    createdBy: String
    updatedBy: String
  }
`;

const resolvers = {
  Query: {
    postComments: async (
      _,
      { postId, pageSize = 0, pageNo = 0 },
      { asset, user }
    ) => {
      if (!asset || !user) {
        return new AuthenticationError('Not authorized to access this content');
      }
      const model = getCollection(
        asset,
        postCommentCollection,
        postCommentSchema
      );
      const response = await model
        .find({ postId: postId })
        .sort({ parentId: 1, createdAt: 1 })
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
    updatePostComment: async (_, { payload }, { asset, user }) => {
      if (!asset || !user) {
        return new AuthenticationError('Not authorized to access this content');
      }
      const model = getCollection(
        asset,
        postCommentCollection,
        postCommentSchema
      );

      let id = payload.id;

      if (!id) {
        const postModel = getCollection(asset, postCollection, postSchema);
        await postModel.findByIdAndUpdate(
          payload.postId,
          { $inc: { comments: 1 } },
          { new: true }
        );
        const response = await new model({
          ...payload,
          createdBy: user.userId,
        }).save();
        id = response.id;
      }

      return await model.findByIdAndUpdate(
        id,
        {
          ...payload,
          parentId: payload.parentId || id,
          updatedBy: user.userId,
        },
        {
          new: true,
        }
      );
    },
  },
};

module.exports = { typeDefs, resolvers };
