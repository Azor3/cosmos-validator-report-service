const axios = require("axios");

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

    // Tüm doğrulayıcıları döndür
    return allValidators;
  } catch (error) {
    console.error("API çağrısı sırasında bir hata oluştu:", error.message);
    return [];
  }
}

async function displayValidators() {
  const validators = await fetchAllValidators();

  // Token miktarına göre sıralama (büyükten küçüğe)
  validators.sort((a, b) => parseFloat(b.tokens) - parseFloat(a.tokens));

  // Sıralanmış doğrulayıcıları yazdır
  validators.forEach((validator, index) => {
    console.log(`Rank: ${index + 1}`);
    console.log(`Moniker: ${validator.description.moniker}`);
    console.log(`Valoper Address: ${validator.operator_address}`);
    console.log(`Tokens (Voting Power): ${validator.tokens}`);
    console.log(`Keybase Identity: ${validator.description.identity}`);
    console.log("------");
  });
}

displayValidators();
