var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const categorySchema = new Schema(
  {
    name: { type: String },
    parentCategoryId: { type: String },
    posts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const categoryCollection = 'post.category';

module.exports = { categorySchema, categoryCollection };
