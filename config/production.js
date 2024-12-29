require("dotenv").config();

module.exports = {
  database: {
    uri: process.env.MONGODB_URI,
  },

  network: {
    name: "mainnet",
  },
};
