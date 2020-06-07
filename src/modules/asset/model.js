var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const assetSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    jwtPassword: { type: String },
    productionMode: { type: Boolean, default: false },
    assetId: { type: String },
  },
  { timestamps: true }
);

const assetCollection = 'asset';

module.exports = { assetSchema, assetCollection };
