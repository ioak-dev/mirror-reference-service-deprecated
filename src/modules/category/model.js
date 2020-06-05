var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const categorySchema = new Schema(
  {
    name: { type: String },
    parentCategoryId: { type: String },
    childCount: { type: Number, default: 0 },
    articleCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const categoryCollection = 'category';

module.exports = { categorySchema, categoryCollection };
