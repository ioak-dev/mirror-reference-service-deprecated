var mongoose = require("mongoose");

const getCollection = (space: any, collection: any, schema: any) => {
  const db = mongoose.connection.useDb(`reach_${space}`);
  return db.model(collection, schema);
};

const getGlobalCollection = (collection: any, schema: any) => {
  const db = mongoose.connection.useDb(`reach`);
  return db.model(collection, schema);
};

export { getCollection, getGlobalCollection };
