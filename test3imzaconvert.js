const axios = require('axios');

const validatorListUrl = 'https://cosmos-lcd.easy2stake.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED';
const blockInfoUrl = 'https://cosmos-lcd.easy2stake.com/cosmos/base/tendermint/v1beta1/blocks/23655882';  // Örnek Block API URL'si

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





// Block bilgisini çekme
async function getBlockInfo() {
    try {
        const response = await axios.get(blockInfoUrl);
        return response.data; // Block bilgisi döndürülür
    } catch (error) {
        console.error('Block bilgisi alınamadı:', error);
    }
}

// İmzası olmayan validatorleri tespit etme
async function getNonSignedValidators() {
    const blockInfo = await getBlockInfo();
    const validators = await fetchAllValidators();

    const signedValidatorSet = blockInfo.block.last_commit.signatures || [];
    const blockheight = blockInfo.block.header.height;
    console.log(`Block Height:  ${blockheight}`);
    // Block bilgisindeki validator imzalarını kontrol etme (null olanlar)
    console.log('Block Imzaları (null olanlar):');
    signedValidatorSet.forEach((signature, index) => {
        if (signature.signature === null) {
            console.log(`Imzası Null olan Validator ${index + 1}: ${signature.validator_address}`);
        }
    });

    // Signed validatorların kimliklerini alıyoruz
    const signedValidatorIds = signedValidatorSet.map(signature => signature.validator_address);

    // Validatorlerin sırasına göre, imzası olmayanları tespit etme
    const nonSignedValidators = signedValidatorIds
        .map((signature, index) => {
            if (signature === null) {
                return validators[index]; // sırasıyla imzası olmayan validatori döndür
            }
        })
        .filter(validator => validator != null); // Null olmayanları filtreliyoruz

    return nonSignedValidators;
}

// Ana fonksiyon
async function main() {
    // Aktif validatorleri sırasıyla yazdırıyoruz
    const validators = await fetchAllValidators();
    console.log('Aktif ve Token Miktarına Göre Sıralanan Validatorler:');
    validators.forEach((validator, index) => {
        console.log(`${index + 1}. ${validator.description.moniker} (${validator.operator_address}) - Token Miktarı: ${validator.tokens}`);
    });

    // İmzası olmayan validatorleri buluyoruz
    const nonSignedValidators = await getNonSignedValidators();

    if (nonSignedValidators.length > 0) {
        console.log('\nImzası Olmayan Validatorler:');
        nonSignedValidators.forEach((validator, index) => {
            console.log(`${index + 1}. ${validator.description.moniker} (${validator.operator_address})`);
        });
    } else {
        console.log('Tüm validatorler blocku imzaladı.');
    }
}

main();