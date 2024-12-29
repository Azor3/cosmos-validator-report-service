const express = require("express");
const router = express.Router();

const mainController = require("../controllers/main");

router.get("/get-info", mainController.getMainInfo);
module.exports = router;
