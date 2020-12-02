const { Schema, Types } = require('mongoose');

const TransactionSchema = new Schema({
  balance: { type: Number, required: true, default: 0 },
  userId: { type: Types.ObjectId, required: true },
  metadata: Object,
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  reference: { type: Types.ObjectId, required: true },
}, { timestamps: true });

module.exports = TransactionSchema;
