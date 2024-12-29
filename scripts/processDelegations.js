const axios = require('axios');
const Validator = require('../models/Validator');

const processDelegations = async (validatorAddress) => {
    try {
        // API'den delegasyonları çek
        const response = await axios.get(
            `https://cosmoshub-mainnet-api.itrocket.net/cosmos/staking/v1beta1/validators/${validatorAddress}/delegations`
        );

        // Delegasyonları istediğimiz formata dönüştür
        const formattedDelegations = response.data.delegation_responses.map(item => ({
            delegator_address: item.delegation.delegator_address,
            amount: item.balance.amount,
            denom: item.balance.denom
        }));

        // Validator'ı bul ve delegasyonları güncelle
        await Validator.findOneAndUpdate(
            { valoper_address: validatorAddress },
            { delegations: formattedDelegations }
        );

        console.log(`${validatorAddress} için ${formattedDelegations.length} delegasyon güncellendi`);

    } catch (error) {
        console.error(`${validatorAddress} için delegasyon işlemlerinde hata:`, error);
        throw error;
    }
};

module.exports = processDelegations;

/*
const axios = require('axios');
const Validator = require('../models/Validator');

const processDelegations = async (validatorAddress) => {
    try {
        // API'den yeni delegasyonları çek
        const response = await axios.get(
            `https://cosmoshub-mainnet-api.itrocket.net/cosmos/staking/v1beta1/validators/${validatorAddress}/delegations`
        );
        const newDelegations = response.data.delegation_responses.map(item => ({
            delegator_address: item.delegation.delegator_address,
            balance: {
                denom: item.balance.denom,
                amount: item.balance.amount
            }
        }));

        // Validator'ı ve mevcut delegasyonları bul
        const validator = await Validator.findOne({ valoper_address: validatorAddress });
        if (!validator) {
            console.log(`Validator ${validatorAddress} bulunamadı`);
            return;
        }

        // Mevcut delegasyonları Map'e dönüştür (hızlı arama için)
        const existingDelegationsMap = new Map(
            validator.delegations.map(d => [d.delegator_address, d])
        );

        // Yeni delegasyonları Map'e dönüştür
        const newDelegationsMap = new Map(
            newDelegations.map(d => [d.delegator_address, d])
        );

        // Değişiklikleri belirle
        const toAdd = [];
        const toUpdate = [];
        const toRemove = [];

        // Yeni eklenecek ve güncellenecek delegasyonları belirle
        for (const [address, newDel] of newDelegationsMap) {
            const existingDel = existingDelegationsMap.get(address);
            if (!existingDel) {
                // Yeni delegasyon
                toAdd.push(newDel);
            } else if (
                //existingDel.shares !== newDel.shares ||
                existingDel.balance.amount !== newDel.balance.amount
            ) {
                // Değişen delegasyon
                toUpdate.push(newDel);
            }
        }

        // Silinecek delegasyonları belirle
        for (const [address] of existingDelegationsMap) {
            if (!newDelegationsMap.has(address)) {
                toRemove.push(address);
            }
        }

        // Bulk güncelleme işlemi
        if (toRemove.length > 0) {
            await Validator.updateOne(
                { valoper_address: validatorAddress },
                { 
                    $pull: { 
                        delegations: { 
                            delegator_address: { $in: toRemove } 
                        } 
                    } 
                }
            );
        }

        if (toAdd.length > 0) {
            await Validator.updateOne(
                { valoper_address: validatorAddress },
                { $push: { delegations: { $each: toAdd } } }
            );
        }

        // Güncellenecek delegasyonları tek tek işle
        for (const delegation of toUpdate) {
            await Validator.updateOne(
                { 
                    valoper_address: validatorAddress,
                    'delegations.delegator_address': delegation.delegator_address 
                },
                { 
                    $set: { 
                        'delegations.$': delegation 
                    } 
                }
            );
        }

        console.log(`
            İşlem tamamlandı:
            Eklenen: ${toAdd.length}
            Güncellenen: ${toUpdate.length}
            Silinen: ${toRemove.length}
        `);

    } catch (error) {
        console.error('Delegasyonlar işlenirken hata:', error);
        throw error;
    }
};

module.exports = processDelegations;
*/