const express = require("express");
const router = express.Router();
const validatorController = require("../controllers/validator");

router.get("/list", validatorController.getValidators);
router.get("/:valoper_address", validatorController.getValidatorDetails);

module.exports = router;