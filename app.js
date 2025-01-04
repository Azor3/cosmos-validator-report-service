const express = require("express");
const mongoose = require("mongoose");
const saveValidatorsFromAPI = require("./scripts/saveValidators");
const validatorRoutes = require("./routes/validator");
const processLatestBlockFromAPI = require("./scripts/processBlock");
const processDelegations = require("./scripts/processDelegations");
const { processValidatorRewards } = require("./scripts/processRewards");
const Validator = require("./models/Validator");
const app = express();
const helmet = require("helmet");
const compression = require("compression");
const config = require("config");
const logger = require("./utils/winstonLogger");
const mainRoutes = require("./routes/main");
const MONGODB_URI = config.get("database.uri");
const schedule = require("./schedule");

// MongoDB bağlantı URL'si
const mongoURI =
  "mongodb+srv://azora:azoradb@araproje.nmbl5.mongodb.net/?retryWrites=true&w=majority&appName=araproje";

async function connectToDB() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB bağlantısı başarılı.");
  } catch (err) {
    console.error("MongoDB bağlantı hatası:", err);
    process.exit(1);
  }
}

async function processAllValidatorsDelegationsAndRewards() {
  try {
    const validators = await Validator.find({}, "valoper_address");
    console.log(`${validators.length} validator için işlemler başlatılıyor...`);

    for (const validator of validators) {
      try {
        console.log(`\n${validator.valoper_address} için işlemler başlıyor...`);

        // Delegasyonları işle
        console.log("Delegasyonlar işleniyor...");
        await processDelegations(validator.valoper_address);

        // Ödülleri işle
        console.log("Ödüller işleniyor...");
        await processValidatorRewards(validator.valoper_address);

        // Rate limit için bekle
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(`${validator.valoper_address} için işlemler tamamlandı.`);
      } catch (error) {
        console.error(
          `Validator ${validator.valoper_address} için hata:`,
          error
        );
        continue;
      }
    }

    console.log("\nTüm validatorler için işlemler tamamlandı.");
  } catch (error) {
    console.error("İşlem sırasında hata:", error);
  }
}

// async function main() {
//     await connectToDB();

//     console.log('\n1. Validator bilgileri güncelleniyor...');
//     await saveValidatorsFromAPI();

//     console.log('\n2. Son blok bilgileri işleniyor...');
//     await processLatestBlockFromAPI();

//     console.log('\n3. Delegasyonlar ve ödüller işleniyor...');
//     await processAllValidatorsDelegationsAndRewards();

//     console.log('\nTüm işlemler tamamlandı. Veritabanı bağlantısı kapatılıyor...');
//     await mongoose.disconnect();
// }

// main().catch(error => {
//     console.error('Ana işlem sırasında hata:', error);
//     process.exit(1);
// });

mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 })
  .then((result) => {
    logger.info("Mongodb Connected");
  })
  .catch((err) => {
    logger.error(err);
  });

  app.use("/main", mainRoutes);
  app.use("/validators", validatorRoutes);


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

app.use(helmet());
app.use(compression());
app.get("/", (req, res) => {
  return res
    .send(
      `App service running in branch: ${process.env.GIT_BRANCH}. Job is: ${process.env.JOB_NAME}`
    )
    .status(200);
});

const server = app.listen(config.get("server.port"), () => {
  logger.info("Server is running on :" + config.get("server.port"));
});
