var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const categorySchema = new Schema(
  {
    name: { type: String },
    parentCategoryId: { type: String },
    articles: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const categoryCollection = 'category';

module.exports = { categorySchema, categoryCollection };
