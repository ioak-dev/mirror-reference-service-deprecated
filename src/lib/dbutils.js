var mongoose = require('mongoose');

const getCollection = (space, collection, schema) => {
  const db = mongoose.connection.useDb(`mirror_${space}`);
  return db.model(collection, schema);
};

module.exports = { getCollection };
