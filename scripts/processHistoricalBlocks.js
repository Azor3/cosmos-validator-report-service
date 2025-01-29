require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Block = require('../models/Block');
const Validator = require('../models/Validator');

// Blok aralığı
const START_BLOCK = 24109823;
const END_BLOCK = 24168702;
const BLOCK_INTERVAL = 10; // Her 10 blokta bir

// API URL template
const getBlockInfoUrl = (height) => `https://rest.cosmos.directory/cosmoshub/cosmos/base/tendermint/v1beta1/blocks/${height}`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processBlock = async (height) => {
    try {
        // Blok zaten var mı kontrol et
        const existingBlock = await Block.findOne({ height });
        if (existingBlock) {
            console.log(`Blok ${height} zaten mevcut, atlanıyor.`);
            return;
        }

        // Blok bilgilerini çek
        const response = await axios.get(getBlockInfoUrl(height));
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

        console.log(`Blok ${height} işleme tamamlandı`);

    } catch (err) {
        console.error(`Blok ${height} işlenirken bir hata oluştu:`, err.message);
        throw err;
    }
};

const processBlockRange = async () => {
    try {
        for (let height = START_BLOCK + 1; height <= END_BLOCK; height += BLOCK_INTERVAL) {
            try {
                await processBlock(height);
                // Her blok işlemi arasında 1 saniye bekle
                await sleep(1000);
            } catch (error) {
                console.error(`Blok ${height} işlenirken hata oluştu, 5 saniye sonra tekrar denenecek:`, error.message);
                await sleep(5000);
                height -= BLOCK_INTERVAL; // Hata alınan bloğu tekrar dene
            }
        }
        console.log('Tüm blokların işlenmesi tamamlandı');
    } catch (err) {
        console.error('İşlem sırasında bir hata oluştu:', err);
    }
};

// MongoDB bağlantısı ve script başlatma
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB bağlantısı başarılı');
        console.log(`${START_BLOCK} ile ${END_BLOCK} arasındaki bloklar ${BLOCK_INTERVAL} aralıklarla işlenmeye başlanıyor...`);
        return processBlockRange();
    })
    .catch((err) => {
        console.error('MongoDB bağlantı hatası:', err);
    }); 