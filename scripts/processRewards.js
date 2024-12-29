// services/processRewards.js
const axios = require('axios');
const ValidatorReward = require('../models/ValidatorReward');
const Validator = require('../models/Validator');

const processValidatorRewards = async (validatorAddress) => {
    try {
        // API'den ödül bilgilerini çek
        const response = await axios.get(
            `https://cosmos-lcd.easy2stake.com/cosmos/distribution/v1beta1/validators/${validatorAddress}/outstanding_rewards`
        );

        // Yeni ödül kaydı oluştur
        const newReward = new ValidatorReward({
            validator_address: validatorAddress,
            timestamp: new Date(),
            rewards: response.data.rewards.rewards
        });

        await newReward.save();
        console.log(`${validatorAddress} için ödül bilgileri kaydedildi`);

    } catch (error) {
        console.error(`${validatorAddress} için ödül bilgileri işlenirken hata:`, error);
        throw error;
    }
};

const processAllValidatorsRewards = async () => {
    try {
        // Tüm validatorları veritabanından çek
        const validators = await Validator.find({}, 'valoper_address');
        console.log(`${validators.length} validator için ödül güncellemesi başlatılıyor...`);

        for (const validator of validators) {
            try {
                await processValidatorRewards(validator.valoper_address);
                // Rate limit için bekle
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Validator ${validator.valoper_address} için hata:`, error);
                continue;
            }
        }

        console.log('Tüm validatorler için ödül güncellemesi tamamlandı.');
    } catch (error) {
        console.error('Ödül güncelleme işleminde hata:', error);
    }
};

module.exports = { processValidatorRewards, processAllValidatorsRewards };