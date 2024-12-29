const mongoose = require('mongoose');
const axios = require('axios');
const Validator = require('../models/ValidatorReward.js'); // Validator modelini import edin

// API URL
const validatorListUrl = 'https://cosmos-lcd.easy2stake.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED';

// Validator verilerini API'den çek ve kaydet
async function saveValidatorsFromAPI() {
  try {
    //const response = await axios.get(validatorListUrl);
    const validators = await fetchAllValidators();

    for (let v of validators) {
      const validatorData = {
        valoper_address: v.operator_address,
        moniker: v.description.moniker,
        website: v.description.website || '',
        detail: v.description.details || '',
        status: v.status,
        jailed: v.jailed,
        bonded_tokens: Number(v.tokens),
        delegator_shares: Number(v.delegator_shares),
        commission_rate: Number(v.commission.commission_rates.rate),
      };

      await Validator.findOneAndUpdate(
        { valoper_address: v.operator_address }, // Güncelleme kriteri
        validatorData,
        { upsert: true, new: true }
      );
    }

    console.log('Validator verileri başarıyla kaydedildi.');
  } catch (err) {
    console.error('Validator verileri kaydedilemedi:', err);
  }
}

async function fetchAllValidators() {
  const allValidators = [];
  let nextKey = null;

  try {
    do {
      // Sayfalı istek
      const response = await axios.get(
        "https://cosmos-api.stakeandrelax.net/cosmos/staking/v1beta1/validators",
        {
          params: {
            status: "BOND_STATUS_BONDED", // Sadece aktif doğrulayıcılar
            "pagination.key": nextKey, // Sonraki sayfa için anahtar
          },
        }
      );

      // Gelen doğrulayıcıları listeye ekle
      allValidators.push(...response.data.validators);

      // Bir sonraki sayfa anahtarını al
      nextKey = response.data.pagination.next_key;

    } while (nextKey); // Sonraki sayfa varsa devam et
    const sortedValidators = allValidators.sort((a, b) => parseFloat(b.tokens) - parseFloat(a.tokens));
    // Tüm doğrulayıcıları döndür
    return sortedValidators;
  } catch (error) {
    console.error("API çağrısı sırasında bir hata oluştu:", error.message);
    return [];
  }
}


module.exports = saveValidatorsFromAPI;
