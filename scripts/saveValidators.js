/*
const mongoose = require('mongoose');
const axios = require('axios');
const Validator = require('../models/Validator.js');

async function saveValidatorsFromAPI() {
  try {
    // Önce tüm validatorleri getir ve sırala
    const validators = await fetchAllValidators();
    console.log(`Toplam ${validators.length} validator bulundu.`);

    // Sıralanmış validatorleri bir array'de tut
    const sortedValidators = validators.sort((a, b) => {
      const aTokens = BigInt(a.tokens || '0');
      const bTokens = BigInt(b.tokens || '0');
      return bTokens > aTokens ? 1 : bTokens < aTokens ? -1 : 0;
    });

    // İlk 10 validatoru logla (kontrol için)
    console.log('\nAPI\'den alınan ilk 10 validator (sıralı):');
    sortedValidators.slice(0, 10).forEach((v, i) => {
      console.log(`${i + 1}. ${v.description.moniker}: ${v.tokens} tokens`);
    });

    // Her validator için güncelleme yap
    for (let i = 0; i < sortedValidators.length; i++) {
      const v = sortedValidators[i];
      const validatorData = {
        rank: i + 1, // 1'den başlayan sıra numarası
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

      try {
        // Mevcut validator'ü kontrol et
        const existingValidator = await Validator.findOne({ 
          valoper_address: v.operator_address 
        });

        if (existingValidator) {
          // Değişiklik var mı kontrol et
          const hasChanged = 
            existingValidator.rank !== validatorData.rank ||
            existingValidator.bonded_tokens !== validatorData.bonded_tokens ||
            existingValidator.commission_rate !== validatorData.commission_rate ||
            existingValidator.status !== validatorData.status ||
            existingValidator.jailed !== validatorData.jailed ||
            existingValidator.moniker !== validatorData.moniker ||
            existingValidator.website !== validatorData.website ||
            existingValidator.detail !== validatorData.detail;

          if (hasChanged) {
            // Sadece değişiklik varsa güncelle
            await Validator.findOneAndUpdate(
              { valoper_address: v.operator_address },
              validatorData,
              { new: true }
            );
            console.log(`${i + 1}. ${v.description.moniker} güncellendi (${v.tokens} tokens)`);
          }
        } else {
          // Yeni validator ise oluştur
          await Validator.create(validatorData);
          console.log(`${i + 1}. ${v.description.moniker} oluşturuldu (${v.tokens} tokens)`);
        }
      } catch (error) {
        console.error(`${v.description.moniker} işlenirken hata:`, error);
      }
    }

    // Kaydedilen sıralamayı kontrol et
    const savedValidators = await Validator.find().sort({ rank: 1 }).limit(10);
    console.log('\nKaydedilen ilk 10 validator:');
    savedValidators.forEach(v => {
      console.log(`${v.rank}. ${v.moniker}: ${v.bonded_tokens} tokens`);
    });

    console.log('Tüm validator verileri başarıyla işlendi.');
  } catch (err) {
    console.error('Validator verileri işlenirken hata:', err);
  }
}
*/
const mongoose = require('mongoose');
const axios = require('axios');
const Validator = require('../models/Validator.js');

async function saveValidatorsFromAPI() {
  try {
    // Önce tüm validatorleri getir ve sırala
    const validators = await fetchAllValidators();
    console.log(`Toplam ${validators.length} validator bulundu.`);

    // Sıralanmış validatorleri bir array'de tut
    const sortedValidators = validators.sort((a, b) => {
      const aTokens = BigInt(a.tokens || '0');
      const bTokens = BigInt(b.tokens || '0');
      return bTokens > aTokens ? 1 : bTokens < aTokens ? -1 : 0;
    });

    // İlk 10 validatoru logla (kontrol için)

    // Her validator için güncelleme yap
    for (let i = 0; i < sortedValidators.length; i++) {
      const v = sortedValidators[i];

      const validatorData = {
        rank: i + 1,
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

      try {
        // Mevcut validator'ü kontrol et
        const existingValidator = await Validator.findOne({ 
          valoper_address: v.operator_address 
        });

        if (existingValidator) {
          // Değişiklik var mı kontrol et
          const hasChanged = 
            existingValidator.rank !== validatorData.rank ||
            existingValidator.bonded_tokens !== validatorData.bonded_tokens ||
            existingValidator.commission_rate !== validatorData.commission_rate ||
            existingValidator.status !== validatorData.status ||
            existingValidator.jailed !== validatorData.jailed ||
            existingValidator.moniker !== validatorData.moniker ||
            existingValidator.website !== validatorData.website ||
            existingValidator.detail !== validatorData.detail;

          if (hasChanged) {
            const updatedValidator = await Validator.findOneAndUpdate(
              { valoper_address: v.operator_address },
              validatorData,
              { new: true }
            );
            console.log(`${i + 1}. ${v.description.moniker} güncellendi (${v.tokens} tokens)`);
            
            // stakezone ve Stir için güncelleme sonucunu kontrol et
            if (v.description.moniker === 'stakezone' || v.description.moniker === 'Stir') {
              console.log('Güncelleme sonrası validator:', updatedValidator);
            }
          }
        } else {
          const newValidator = await Validator.create(validatorData);
          console.log(`${i + 1}. ${v.description.moniker} oluşturuldu (${v.tokens} tokens)`);
          
          // stakezone ve Stir için oluşturma sonucunu kontrol et
          if (v.description.moniker === 'stakezone' || v.description.moniker === 'Stir') {
            console.log('Yeni oluşturulan validator:', newValidator);
          }
        }
      } catch (error) {
        console.error(`${v.description.moniker} işlenirken hata:`, error);
      }
    }

    // Kaydedilen sıralamayı kontrol et
    const savedValidators = await Validator.find().sort({ rank: 1 }).limit(10);
    //console.log('\nKaydedilen ilk 10 validator:');
    //savedValidators.forEach(v => {
    //  console.log(`${v.rank}. ${v.moniker}: ${v.bonded_tokens} tokens (${v.valoper_address})`);
      //});

    // stakezone ve Stir validatorlerini özel olarak kontrol et
    console.log('Tüm validator verileri başarıyla işlendi.');
  } catch (err) {
    console.error('Validator verileri işlenirken hata:', err);
  }
}

// ... geri kalan kod aynı ...
async function fetchAllValidators() {
  const allValidators = [];
  let nextKey = null;

  try {
    do {
      const response = await axios.get(
        "https://cosmos-api.stakeandrelax.net/cosmos/staking/v1beta1/validators",
        {
          params: {
            status: "BOND_STATUS_BONDED",
            "pagination.key": nextKey,
          },
        }
      );

      allValidators.push(...response.data.validators);
      nextKey = response.data.pagination.next_key;

    } while (nextKey);

    return allValidators;
  } catch (error) {
    console.error("API çağrısı sırasında bir hata oluştu:", error.message);
    return [];
  }
}

module.exports = saveValidatorsFromAPI;

/*
const mongoose = require('mongoose');
const axios = require('axios');
const Validator = require('../models/Validator.js'); // Validator modelini import edin

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
    //const sortedValidators = allValidators.sort((a, b) => parseFloat(b.tokens) - parseFloat(a.tokens));
    // Tüm doğrulayıcıları döndür
    const sortedValidators = allValidators.sort((a, b) => {
      // BigInt kullanarak büyük sayıları karşılaştır
      const aTokens = BigInt(a.tokens || '0');
      const bTokens = BigInt(b.tokens || '0');
      
      // BigInt'leri karşılaştır
      if (bTokens > aTokens) return 1;
      if (bTokens < aTokens) return -1;
      return 0;
    });
    // Sıralama sonuçlarını logla
console.log('İlk 5 validator (token miktarına göre):');
sortedValidators.slice(0, 5).forEach((v, index) => {
  console.log(`${index + 1}. ${v.description.moniker}: ${v.tokens} tokens`);
});
    return sortedValidators;
  } catch (error) {
    console.error("API çağrısı sırasında bir hata oluştu:", error.message);
    return [];
  }
}


module.exports = saveValidatorsFromAPI;


*/