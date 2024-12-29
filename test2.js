const axios = require('axios');
const { fromBase64, toBech32 } = require('@cosmjs/encoding');

// API Endpoints
const blockApiUrl = "https://cosmos-lcd.easy2stake.com/cosmos/base/tendermint/v1beta1/blocks";
const validatorsSetApiUrl = "https://cosmos-lcd.easy2stake.com/cosmos/base/tendermint/v1beta1/validatorsets/latest";

// Blok verilerini al
async function fetchBlockData(blockHeight) {
  try {
    const response = await axios.get(`${blockApiUrl}/${blockHeight}`);
    return response.data;
  } catch (error) {
    console.error(`Blok verileri alınırken hata oluştu (blok: ${blockHeight}):`, error.message);
    return null;
  }
}

// Aktif validatorların valcons adreslerini al
async function fetchValidatorSet() {
  try {
    const response = await axios.get(validatorsSetApiUrl);
    return response.validators;
  } catch (error) {
    console.error('Validator seti alınırken hata oluştu:', error.message);
    return [];
  }
}

// Validator imzalarını karşılaştır
function compareValidatorsAndSignatures(validators, blockData) {
  const signedAddresses = blockData.block.last_commit.signatures
    .filter(sig => sig.block_id_flag === "BLOCK_ID_FLAG_COMMIT")
    .map(sig => {
      // Base64 adresini Bech32 formatına dönüştür
      return toBech32('cosmosvalcons', fromBase64(sig.validator_address));
    });

  console.log("Signed Addresses (Base64 and Bech32 format):");
  signedAddresses.forEach((signedAddress) => {
    console.log(`Base64: ${signedAddress}`);
    console.log(`Bech32: ${toBech32('cosmosvalcons', fromBase64(signedAddress))}`);
    console.log('------');
  });

  const unsignedValidators = validators.filter(validator => {
    // Validatorun pubkey'ini Base64 formatına al ve Bech32'e dönüştür
    const decodedAddress = fromBase64(validator.consensus_pubkey.key);
    const bech32Address = toBech32('cosmosvalcons', decodedAddress);

    // Hangi adreslerin eşleşmediğini görmek için yazdırma
    console.log(`Validator Moniker: ${validator.description.moniker}`);
    console.log(`Decoded Address (Base64): ${decodedAddress.toString('hex')}`);
    console.log(`Bech32 Address: ${bech32Address}`);
    console.log(`Signed: ${signedAddresses.includes(bech32Address)}`);
    console.log("------");

    return !signedAddresses.includes(bech32Address);
  });

  return unsignedValidators;
}

// Ana fonksiyon
async function main() {
  const blockHeight = 23332618; // Test için sabit blok yüksekliği

  // Blok verilerini al
  const blockData = await fetchBlockData(blockHeight);
  if (!blockData) {
    console.error("Blok verileri alınamadı.");
    return;
  }

  // Aktif validator setini al
  const validators = await fetchValidatorSet();
  if (validators.length === 0) {
    console.error("Aktif validator verileri alınamadı.");
    return;
  }

  // İmzaları karşılaştır
  const unsignedValidators = compareValidatorsAndSignatures(validators, blockData);

  // Sonuçları yazdır (ilk 10 validator için)
  console.log(`Blok ${blockHeight} için imza atmamış validatorler:`);
  unsignedValidators.slice(0, 10).forEach(validator => {
    console.log(`Moniker: ${validator.description.moniker}`);
    console.log(`Valoper Address: ${validator.operator_address}`);
    console.log("------");
  });
}

main();
