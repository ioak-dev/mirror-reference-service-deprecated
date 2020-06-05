var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const articleSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    categoryId: { type: String },
    views: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const articleCollection = 'article';

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { articleSchema, articleCollection };
