if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => server.stop());
}

const { ApolloServer } = require("apollo-server-express");
import { authorize } from "./middlewares";
import mongoose from "mongoose";
import { initializeSequences } from "./startup";
const express = require("express");
const cors = require("cors");

const ApiRoute = require("./route");

const gqlScalarSchema = require("./modules/gql-scalar");
const assetSchema = require("./modules/asset");
const sessionSchema = require("./modules/session");
const userSchema = require("./modules/user");
const articleSchema = require("./modules/article");
const articleCommentSchema = require("./modules/article/comment");
const articleCommentFeedbackSchema = require("./modules/article/comment/feedback");
const articleFeedbackSchema = require("./modules/article/feedback");
const postSchema = require("./modules/post");
const postCommentSchema = require("./modules/post/comment");
const postCommentFeedbackSchema = require("./modules/post/comment/feedback");
const postFeedbackSchema = require("./modules/post/feedback");
const postFollowerSchema = require("./modules/post/follower");

const databaseUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
mongoose.connect(databaseUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.pluralize(undefined);

const app = express();

const server = new ApolloServer({
  typeDefs: [
    gqlScalarSchema.typeDefs,
    assetSchema.typeDefs,
    sessionSchema.typeDefs,
    userSchema.typeDefs,
    articleSchema.typeDefs,
    articleCommentSchema.typeDefs,
    articleCommentFeedbackSchema.typeDefs,
    articleFeedbackSchema.typeDefs,
    postSchema.typeDefs,
    postCommentSchema.typeDefs,
    postCommentFeedbackSchema.typeDefs,
    postFeedbackSchema.typeDefs,
    postFollowerSchema.typeDefs,
  ],
  resolvers: [
    gqlScalarSchema.resolvers,
    assetSchema.resolvers,
    sessionSchema.resolvers,
    userSchema.resolvers,
    articleSchema.resolvers,
    articleCommentSchema.resolvers,
    articleCommentFeedbackSchema.resolvers,
    articleFeedbackSchema.resolvers,
    postSchema.resolvers,
    postCommentSchema.resolvers,
    postCommentFeedbackSchema.resolvers,
    postFeedbackSchema.resolvers,
    postFollowerSchema.resolvers,
  ],
  context: ({ req, res }: any) => {
    const authString = req.headers.authorization || "";
    const authParts = authString.split(" ");
    let token = "";
    let user = null;
    let asset = "";
    if (authParts.length === 2) {
      token = authParts[1];
      asset = authParts[0];
      user = authorize(token);
    }
    return { user, token, asset };
  },
  introspection: true,
  playground: true,
});

server.applyMiddleware({ app });

app.use(cors());
app.use(express.json({ limit: 5000000 }));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use("/api", ApiRoute);

app.use((_: any, res: any) => {
  res.status(200);
  res.send("Hello!");
  res.end();
});

app.listen({ port: process.env.PORT || 4000 }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${process.env.PORT || 4000}${
      server.graphqlPath
    }`
  )
);

// server
//   .listen({ port: process.env.PORT || 4000 })
//   .then(({ url }: any) => console.log(`Server started at ${url}`));

// Server startup scripts
initializeSequences();
