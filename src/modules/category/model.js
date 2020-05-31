var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const categorySchema = new Schema({
  name: { type: String },
  parentCategoryId: { type: String },
});

const categoryCollection = 'category';

module.exports = { categorySchema, categoryCollection };
