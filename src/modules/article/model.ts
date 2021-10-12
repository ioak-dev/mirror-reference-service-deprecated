var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const articleSchema = new Schema(
  {
    title: { type: Array },
    description: { type: Array },
    categoryId: { type: String },
    views: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isAnswered: { type: Boolean, default: false },
    answeredOn: { type: Date },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

const articleCollection = "article";

// module.exports = mongoose.model('bookmarks', articleSchema);
export { articleSchema, articleCollection };
