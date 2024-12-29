const cron = require("node-cron");
const { Worker } = require("worker_threads");
const path = require("path");
const logger = require("./utils/winstonLogger");

// Yeni worker thread oluşturuluyor
const cosmosChecker = new Worker(
  path.join(__dirname, "workers", "checkCosmos.js")
);

// Cron job her 10 saniyede bir çalışacak şekilde ayarlanıyor
const task = cron.schedule("*/5 * * * * *", async () => {
  logger.info("Scheduled task started");
  cosmosChecker.postMessage(0); // Worker thread'e mesaj gönderiliyor
});

module.exports = () => {
  task.start(); // Cron job başlatılıyor
};
