if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => server.stop());
}

import { ApolloServer, AuthenticationError } from 'apollo-server';
import { authorize } from './middlewares';
import mongoose from 'mongoose';

const databaseUri = process.env.DATABASE_URI || 'mongodb://localhost:27017';
mongoose.connect(databaseUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.pluralize(undefined);

const server = new ApolloServer({
  modules: [
    require('./modules/article'),
    require('./modules/category'),
    require('./modules/user/index.ts'),
  ],
  context: ({ req, res }: any) => {
    const token = req.headers.authorization || '';
    const user = authorize(token);
    return { user, token };
  },
});

server.listen().then(({ url }: any) => console.log(`Server started at ${url}`));
