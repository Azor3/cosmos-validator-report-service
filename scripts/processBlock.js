const mongoose = require('mongoose');
const axios = require('axios');
const Block = require('../models/Block');
const Validator = require('../models/ValidatorReward.js');

// API URLs
const blockInfoUrl = 'https://cosmos-lcd.easy2stake.com/cosmos/base/tendermint/v1beta1/blocks/latest';
const validatorSetUrl = 'https://cosmos-lcd.easy2stake.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200';

const processLatestBlockFromAPI = async () => {
    try {
        // Önce aktif validator listesini çek
        const validatorSetResponse = await axios.get(validatorSetUrl);
        const activeValidators = validatorSetResponse.data.validators;
        
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

        // İmzası olmayan validatorleri tespit et ve güncelle
        const updatePromises = signatures.map(async (signature, index) => {
            if (signature.signature === null) {
                console.log(`Imzası Null olan Validator ${index + 1}: ${signature.signature}`);
                
                // API'den alınan sıralamaya göre validator'ı bul
                const sortedValidators = activeValidators.sort((a, b) => parseFloat(b.tokens) - parseFloat(a.tokens));
                const validator = sortedValidators[index];
                if (validator) {
                    // Veritabanındaki validator'ı güncelle
                    const result = await Validator.findOneAndUpdate(
                        { valoper_address: validator.operator_address },
                        { 
                            $addToSet: { missed_block_heights: blockHeight }
                        },
                        { new: true }
                    );

                    if (result) {
                        console.log(`Validator ${validator.description.moniker} (${validator.operator_address}) missed_block_heights güncellendi.`);
                    } else {
                        console.log(`Validator ${validator.description.moniker} veritabanında bulunamadı.`);
                    }
                }
            }
        });

        await Promise.all(updatePromises);

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