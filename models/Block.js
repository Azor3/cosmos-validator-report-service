const mongoose = require('mongoose');

const SignatureSchema = new mongoose.Schema({
  valoper_address: { type: String, required: false },
  signature: { type: String, required: false },
  timestamp: { type: Date, required: false },
});

const BlockSchema = new mongoose.Schema({
  height: { type: Number, unique: true, required: true },
  date: { type: Date, required: true },
  signatures: { type: [SignatureSchema], default: [] },
});

module.exports = mongoose.model('Block', BlockSchema);
