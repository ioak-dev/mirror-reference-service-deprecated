if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => server.stop());
}

import { ApolloServer, AuthenticationError } from 'apollo-server';
import { authorize } from './middlewares';
import mongoose from 'mongoose';
import { initializeSequences } from './startup';

const databaseUri = process.env.DATABASE_URI || 'mongodb://localhost:27017';
mongoose.connect(databaseUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.pluralize(undefined);

const server = new ApolloServer({
  modules: [
    require('./modules/article'),
    require('./modules/article/tag'),
    require('./modules/article/feedback'),
    require('./modules/article/category'),
    require('./modules/asset'),
    require('./modules/session'),
    require('./modules/user/index.ts'),
  ],
  context: ({ req, res }: any) => {
    const token = req.headers.authorization || '';
    const user = authorize(token);
    return { user, token };
  },
  introspection: true,
  playground: true,
});

server
  .listen({ port: process.env.PORT || 4000 })
  .then(({ url }: any) => console.log(`Server started at ${url}`));

// Server startup scripts
initializeSequences();
