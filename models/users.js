const { Schema } = require('mongoose');

const UserSchema = new Schema({
  name: { type: String, required: true },
  balance: { type: Number, required: true, default: 0.00 },
}, { timestamps: true });

module.exports = UserSchema;
