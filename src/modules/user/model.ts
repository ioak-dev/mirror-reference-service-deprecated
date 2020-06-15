var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    resolver: { type: String },
  },
  { timestamps: true }
);

const userCollection = 'user';

// module.exports = mongoose.model('bookmarks', articleSchema);
export { userSchema, userCollection };
