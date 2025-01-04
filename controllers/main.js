const Block = require('../models/Block');
const Validator = require('../models/Validator');

exports.getMainInfo = async (req, res, next) => {
  try {
    // Son eklenen block'u bul
    const lastBlock = await Block.findOne().sort({ height: -1 });
    
    // Tüm validatorleri getir
    const validators = await Validator.find();
    
    // Toplam bounded token miktarını hesapla
    const totalBoundedTokens = validators.reduce((sum, validator) => {
      return sum + (validator.bonded_tokens || 0);
    }, 0);

    res.json({
      status: 200,
      data: {
        last_block_height: lastBlock ? lastBlock.height : 0,
        validator_count: validators.length,
        total_bounded_tokens: totalBoundedTokens
      }
    });
  } catch (error) {
    console.error('Error in getMainInfo:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error'
    });
  }
};



/*
exports.getMainInfo = async (req, res, next) => {
  res.json({ status: 200 });
};
*/