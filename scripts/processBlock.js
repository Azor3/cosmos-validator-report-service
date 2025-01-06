const mongoose = require('mongoose');
const axios = require('axios');
const Block = require('../models/Block');
const Validator = require('../models/Validator');

// API URL
const blockInfoUrl = 'https://cosmos-api.stakeandrelax.net/cosmos/base/tendermint/v1beta1/blocks/latest';

const processLatestBlockFromAPI = async () => {
    try {
        // Blok bilgilerini çek
        const response = await axios.get(blockInfoUrl);
        const blockData = response.data;

        const blockHeight = parseInt(blockData.block.header.height, 10);
        const blockTimestamp = new Date(blockData.block.header.time);
        const signatures = blockData.block.last_commit.signatures;

        // Yeni blok kaydı oluştur
        const newBlock = new Block({
            height: blockHeight,
            date: blockTimestamp,
            signatures: signatures.map((sig) => ({
                valoper_address: sig.validator_address || null,
                signature: sig.signature || null,
                timestamp: sig.timestamp || null,
            })),
        });

        // Veritabanına blok kaydet
        await newBlock.save();
        console.log(`Blok ${blockHeight} başarıyla kaydedildi.`);

        // Veritabanından validatorleri rank'e göre sıralı şekilde getir
        const validators = await Validator.find().sort({ rank: 1 });

        // İmzası olmayan validatorleri tespit et ve güncelle
        for (let i = 0; i < signatures.length; i++) {
            const signature = signatures[i];
            if (signature.signature === null) {
                console.log(`Imzası Null olan Validator ${i + 1}`);
                
                // Sıra numarasına göre validator'ı bul
                if (i < validators.length) {
                    const validator = validators[i];
                    // Missed block'u ekle
                    await Validator.updateOne(
                        { _id: validator._id },
                        { $addToSet: { missed_block_heights: blockHeight } }
                    );
                    console.log(`${validator.moniker} (rank: ${validator.rank}) için missed block eklendi: ${blockHeight}`);
                } else {
                    console.log(`${i + 1}. sırada validator bulunamadı`);
                }
            }
        }

        console.log('Blok işleme tamamlandı');

    } catch (err) {
        console.error('Blok verileri işlenirken bir hata oluştu:', err);
    }
};

module.exports = processLatestBlockFromAPI;
/*
const mongoose = require('mongoose');
const axios = require('axios');
const Block = require('../models/Block');
const Validator = require('../models/Validator');

// API URL
const blockInfoUrl = 'https://cosmoshub-mainnet-api.itrocket.net/cosmos/base/tendermint/v1beta1/blocks/23655882';

const processLatestBlockFromAPI = async () => {
    try {
        const response = await axios.get(blockInfoUrl);
        const blockData = response.data;

        const blockHeight = parseInt(blockData.block.header.height, 10);
        const blockTimestamp = new Date(blockData.block.header.time);
        const signatures = blockData.block.last_commit.signatures;

        // Yeni blok kaydı oluştur
        const newBlock = new Block({
            height: blockHeight,
            date: blockTimestamp,
            signatures: signatures.map((sig) => ({
                valoper_address: sig.validator_address || null,
                signature: sig.signature || null,
                timestamp: sig.timestamp || null,
            })),
        });

        // Veritabanına blok kaydet
        await newBlock.save();
        console.log(`Blok ${blockHeight} başarıyla kaydedildi.`);

        // İmzası olmayan validatorleri tespit et
        const missedValidatorIndices = [];
        signatures.forEach((signature, index) => {
            if (signature.signature === null) {
                missedValidatorIndices.push(index + 1); // 1-based index
                console.log(`Imzası Null olan Validator ${index + 1}: ${signature.validator_address}`);
            }
        });

        // Tüm validator'ları sıralı şekilde getir
        const validators = await Validator.find().sort({ "valoper_address": 1 });

        // Kaçıran validator'ların missed_block_heights'larını güncelle
        const updatePromises = missedValidatorIndices.map(async (index) => {
            const validator = validators[index - 1]; // 0-based array için -1
            if (validator) {
                validator.missed_block_heights.push(blockHeight);
                await validator.save();
                console.log(`Validator sıra ${index} (${validator.moniker}) missed_block_heights güncellendi.`);
            } else {
                console.log(`Validator sıra ${index} bulunamadı.`);
            }
        });

        // Tüm güncellemelerin tamamlanmasını bekle
        await Promise.all(updatePromises);

    } catch (err) {
        console.error('Blok verileri işlenirken bir hata oluştu:', err);
    }
};

module.exports = processLatestBlockFromAPI;
*/