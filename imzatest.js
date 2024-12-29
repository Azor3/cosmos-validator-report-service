const axios = require('axios');
const { fromBase64, toBech32 } = require('@cosmjs/encoding');

// API Endpoints
const blockApiUrl = "https://cosmos-lcd.easy2stake.com/cosmos/base/tendermint/v1beta1/blocks";
const validatorsApiUrl = "https://cosmos-api.stakeandrelax.net/cosmos/staking/v1beta1/validators";
// En son blok yüksekliğini almak için API'yi kullan
async function getLatestBlockHeight() {
  try {
    const response = await axios.get("https://cosmos-lcd.easy2stake.com/cosmos/base/tendermint/v1beta1/blocks/latest");
    return response.data.block.header.height;
  } catch (error) {
    console.error('En son blok yüksekliği alınırken hata oluştu:', error.message);
    return null;
  }
}

// Belirli bir blok verilerini al
async function fetchBlockData(blockHeight) {
  try {
    //const response = await axios.get(`${blockApiUrl}/${blockHeight}`);
    const response = await axios.get(`${blockApiUrl}/${blockHeight}`);
    return response.data;
  } catch (error) {
    console.error(`Blok verileri alınırken hata oluştu (blok: ${blockHeight}):`, error.message);
    return null;
  }
}

// Aktif validator listesini al
async function fetchValidators() {
  try {
    const response = await axios.get(validatorsApiUrl, {
      params: { status: "BOND_STATUS_BONDED" }
    });
    return response.data.validators;
  } catch (error) {
    console.error('Validator verileri alınırken hata oluştu:', error.message);
    return [];
  }
}

// Validator imzalarını karşılaştır
function compareValidatorsAndSignatures(validators, blockData) {
  const signedAddresses = blockData.block.last_commit.signatures
    .filter(sig => sig.block_id_flag === "BLOCK_ID_FLAG_COMMIT")
    .map(sig => sig.validator_address);

  const unsignedValidators = validators.filter(validator => {
    const decodedAddress = fromBase64(validator.consensus_pubkey.key);
    const bech32Address = toBech32('cosmosvalcons', decodedAddress);
    return !signedAddresses.includes(bech32Address);
  });

  return unsignedValidators;
}

// Ana fonksiyon
async function main() {
  const latestBlockHeight = await getLatestBlockHeight();
  if (!latestBlockHeight) {
    console.error("En son blok yüksekliği alınamadı.");
    return;
  }

  // Bir önceki bloğun yüksekliğini al
  const blockHeight = latestBlockHeight - 1;

  // Blok verilerini al
  const blockData = await fetchBlockData(blockHeight);
  if (!blockData) {
    console.error("Blok verileri alınamadı.");
    return;
  }

  // Aktif validatorları al
  const validators = await fetchValidators();
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
