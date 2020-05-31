const { AuthenticationError } = require('apollo-server');

const isUnauthorized = (user) => {
  if (!user) {
    return new AuthenticationError('Not authorized to access this content');
  }
  return false;
};

module.exports = { isUnauthorized };
