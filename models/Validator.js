const mongoose = require('mongoose');

const delegationSchema = new mongoose.Schema({
  delegator_address: String,
  amount: String,
  denom: String
});

const ValidatorSchema = new mongoose.Schema({
  valoper_address: { type: String, unique: true },
  moniker: String,
  website: String,
  detail: String,
  status: String,
  jailed: Boolean,
  bonded_tokens: Number,
  delegator_shares: Number,
  commission_rate: Number,
  active_set_enter_heights: { type: [Number], default: [] },
  active_set_exit_heights: { type: [Number], default: [] },
  missed_block_heights: { type: [Number], default: [] },
  outstanding_rewards: { type: Number, default: 0 },
  commission_rewards: { type: Number, default: 0 },
  delegations: { type: [delegationSchema], default: []},
});

module.exports = mongoose.model('Validator', ValidatorSchema);
