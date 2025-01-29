const mongoose = require('mongoose');
const fs = require('fs');
const Validator = require('./models/Validator'); // Daha önce oluşturduğumuz Validator modeli
const Block = require('./models/Block'); // Daha önce oluşturduğumuz Block modeli

// MongoDB bağlantı URL'si (kendi bağlantınızı girin)
const mongoURI = '';

// MongoDB'ye bağlanma
async function connectToDB() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB bağlantısı başarılı.');
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  }
}

// Blok bilgilerini işle ve imzalamayan validatorleri kaydet
async function processBlockData() {
  try {
    // Dosyadan blok bilgisi oku
    const blockData = JSON.parse(fs.readFileSync('latestblock.json', 'utf8'));

    const blockHeight = parseInt(blockData.block.header.height, 10);
    const blockTimestamp = new Date(blockData.block.header.time);
    const signatures = blockData.block.last_commit.signatures;

    // Yeni blok kaydı oluştur
    const newBlock = new Block({
      height: blockHeight,
      date: blockTimestamp,
      signatures: signatures.map((sig) => ({
        valoper_address: sig.validator_address,
        signature: sig.signature || null,
        timestamp: sig.timestamp || null,
      })),
    });

    // Veritabanına blok kaydet
    await newBlock.save();
    console.log(`Blok ${blockHeight} başarıyla kaydedildi.`);

    // İmzası olmayan validatorleri işleme
    for (const signature of signatures) {
      if (!signature.signature) {
        const valoperAddress = signature.validator_address;
        if (valoperAddress) {
          console.log(`Validator ${valoperAddress} blok ${blockHeight}'i imzalamadı.`);
          const validator = await Validator.findOne({ valoper_address: valoperAddress });
          if (validator) {
            validator.missed_block_heights.push(blockHeight);
            await validator.save();
            console.log(`Validator ${valoperAddress} missed_block_heights güncellendi.`);
          } else {
            console.log(`Validator ${valoperAddress} veritabanında bulunamadı.`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Blok verileri işlenirken bir hata oluştu:', err);
  }
}

// Ana işlev
async function main() {
  await connectToDB();
  await processBlockData();
  mongoose.disconnect();
}

main();
