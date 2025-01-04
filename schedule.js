const cron = require('node-cron');
const saveValidatorsFromAPI = require('./scripts/saveValidators');
const processLatestBlockFromAPI = require('./scripts/processBlock');
const processDelegations = require('./scripts/processDelegations');
const { processValidatorRewards } = require('./scripts/processRewards');
const Validator = require('./models/Validator');
const logger = require('./utils/winstonLogger');

// Her 5 saniyede bir çalışacak fonksiyon (blok ve validator bilgileri)
const updateFrequentData = async () => {
  try {
    logger.info('Sık güncelleme işlemi başlatılıyor...');
    
    // Validator bilgilerini güncelle
    await saveValidatorsFromAPI();
    logger.info('Validator bilgileri güncellendi');

    // Son blok bilgilerini işle
    await processLatestBlockFromAPI();
    logger.info('Son blok bilgileri işlendi');

    logger.info('Sık güncelleme işlemleri tamamlandı');
  } catch (error) {
    logger.error('Sık güncelleme işlemi sırasında hata:', error);
  }
};

// Günde bir kez çalışacak fonksiyon (delegasyonlar ve ödüller)
const updateDailyData = async () => {
  try {
    logger.info('Günlük güncelleme işlemi başlatılıyor...');
    
    // Tüm validatorler için delegasyon ve ödül bilgilerini güncelle
    const validators = await Validator.find({}, 'valoper_address');
    
    for (const validator of validators) {
      try {
        // Delegasyonları işle
        await processDelegations(validator.valoper_address);
        logger.info(`${validator.valoper_address} için delegasyon bilgileri güncellendi`);
        
        // Rate limit için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Ödülleri işle
        await processValidatorRewards(validator.valoper_address);
        logger.info(`${validator.valoper_address} için ödül bilgileri güncellendi`);
        
        // Rate limit için bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error(`Validator ${validator.valoper_address} için güncelleme hatası:`, error);
        continue;
      }
    }

    logger.info('Günlük güncelleme işlemleri tamamlandı');
  } catch (error) {
    logger.error('Günlük güncelleme işlemi sırasında hata:', error);
  }
};

// Her 5 saniyede bir çalışacak cronjob (blok ve validator bilgileri)
cron.schedule('*/5 * * * * *', updateFrequentData);

// Her gün 20:30'da çalışacak cronjob (delegasyonlar ve ödüller)
cron.schedule('30 20 * * *', updateDailyData);

logger.info('Scheduler başlatıldı');
logger.info('- Blok ve validator bilgileri her 5 saniyede bir güncellenecek');
logger.info('- Delegasyon ve ödül bilgileri her gün 20:30\'da güncellenecek');

module.exports = {
  updateFrequentData,
  updateDailyData
};