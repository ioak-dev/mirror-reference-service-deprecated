var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const articleSchema = new Schema({
  title: { type: String },
  description: { type: String },
  categoryId: { type: String },
});

const articleCollection = 'article';

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { articleSchema, articleCollection };
