// models/ValidatorReward.js
const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  denom: String,
  amount: String
});

const validatorRewardSchema = new mongoose.Schema({
  validator_address: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  rewards: [rewardSchema]
});

// Compound index for efficient queries
validatorRewardSchema.index({ validator_address: 1, timestamp: 1 });

module.exports = mongoose.model('ValidatorReward', validatorRewardSchema);