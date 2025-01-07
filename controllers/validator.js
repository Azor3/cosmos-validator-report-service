const Block = require('../models/Block');
const Validator = require('../models/Validator');
const ValidatorReward = require('../models/ValidatorReward');

exports.getValidators = async (req, res, next) => {
    try {
      // Tüm validatorleri getir
      const validators = await Validator.find();
      
      // Son block yüksekliğini bul
      const lastBlock = await Block.findOne().sort({ height: -1 });
      const totalBlocks = lastBlock ? lastBlock.height : 0;
      
      // Son 1000 bloğun başlangıç yüksekliğini hesapla
      const startHeight = Math.max(1, totalBlocks - 1000);
  
      // Her validator için gerekli bilgileri hazırla
      const validatorList = await Promise.all(validators.map(async (validator) => {
        // Son 1000 blok içindeki kaçırılan blokları filtrele
        const recentMissedBlocks = validator.missed_block_heights ? 
          validator.missed_block_heights.filter(height => height >= startHeight).length : 0;
        
        // Uptime hesaplaması için son 1000 blok içindeki performansı kullan
        const blocksToConsider = Math.min(1000, totalBlocks);
        const uptime = blocksToConsider > 0 ? 
          ((blocksToConsider - recentMissedBlocks) / blocksToConsider) * 100 : 0;
  
        // Son ödül bilgisini al
        const lastReward = await ValidatorReward.findOne(
          { validator_address: validator.valoper_address },
          { rewards: 1, timestamp: 1 }
        ).sort({ timestamp: -1 });
  
        return {
          moniker: validator.moniker,
          valoper_address: validator.valoper_address,
          jailed: validator.jailed,
          bonded_tokens: validator.bonded_tokens || 0,
          commission_rate: validator.commission_rate || 0,
          missed_blocks_count: recentMissedBlocks,
          uptime: parseFloat(uptime.toFixed(2)), // 2 decimal places
          blocks_considered: blocksToConsider,
          last_reward: lastReward ? {
            amount: lastReward.rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0),
            timestamp: lastReward.timestamp
          } : null
        };
      }));
  
      res.json({
        status: 200,
        data: validatorList
      });
    } catch (error) {
      console.error('Error in getValidators:', error);
      res.status(500).json({
        status: 500,
        error: 'Internal server error'
      });
    }
  };
exports.getValidatorDetails = async (req, res, next) => {
    try {
      const { valoper_address } = req.params;
  
      // Validator bilgilerini getir
      const validator = await Validator.findOne({ valoper_address });
      
      if (!validator) {
        return res.status(404).json({
          status: 404,
          error: 'Validator not found'
        });
      }
  
      // Son block yüksekliğini bul
      const lastBlock = await Block.findOne().sort({ height: -1 });
      const totalBlocks = lastBlock ? lastBlock.height : 0;
      
      // Son 1000 bloğun başlangıç yüksekliğini hesapla
      const startHeight = Math.max(1, totalBlocks - 1000);
  
      // Kaçırılan blokların timestamp'lerini almak için Block modelinden sorgulama
      const missedBlocksWithTime = await Block.find({
        height: { $in: validator.missed_block_heights || [] }
      }, 'height date').sort({ height: 1 });
  
      // Son 1000 blok içindeki kaçırılan blokları filtrele
      const recentMissedBlocks = validator.missed_block_heights ? 
        validator.missed_block_heights.filter(height => height >= startHeight).length : 0;
  
      // Grafik için veri hazırla
      const missedBlocksTimeline = missedBlocksWithTime.map(block => ({
        height: block.height,
        timestamp: block.date,
      }));
      const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const rewardHistory = await ValidatorReward.find({
  validator_address: valoper_address,
  timestamp: { $gte: thirtyDaysAgo }
}).sort({ timestamp: 1 });

// Ödül geçmişini düzenle
const rewardTimeline = rewardHistory.map(reward => ({
  timestamp: reward.timestamp,
  amount: reward.rewards.reduce((sum, r) => sum + parseFloat(r.amount), 0)
}));
  
      const response = {
        valoper_address: validator.valoper_address,
        moniker: validator.moniker,
        website: validator.website,
        detail: validator.detail,
        bonded_tokens: validator.bonded_tokens || 0,
        jailed: validator.jailed,
        commission_rate: validator.commission_rate || 0,
        missed_blocks: {
          total: validator.missed_block_heights ? validator.missed_block_heights.length : 0,
          last_1000_blocks: recentMissedBlocks
        },
        outstanding_rewards: validator.outstanding_rewards || 0,
        commission_rewards: validator.commission_rewards || 0,
        delegations: validator.delegations || [],
        missed_blocks_timeline: missedBlocksTimeline,
        reward_timeline: rewardTimeline
      };
  
      res.json({
        status: 200,
        data: response
      });
  
    } catch (error) {
      console.error('Error in getValidatorDetails:', error);
      res.status(500).json({
        status: 500,
        error: 'Internal server error'
      });
    }
  };