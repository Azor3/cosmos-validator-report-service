const { parentPort } = require("worker_threads");
const mongoose = require("mongoose");
const logger = require("../utils/winstonLogger");
const config = require("config");

async function getCosmosData() {
  logger.info("cron çalışıyor");
}

// Listen for messages from the main thread
parentPort.on("message", async (message) => {
  logger.info("Worker received a message to start processing purchases.");

  try {
    // Initialize MongoDB connection
    await mongoose.connect(config.get("database.uri"));

    // Call the function to process purchases
    await getCosmosData();

    // Close MongoDB connection after processing
    await mongoose.connection.close();

    // Optionally, send a message back to the main thread
    parentPort.postMessage("Purchase processing completed.");
  } catch (error) {
    logger.error("Error in worker:", error);
  }
});
