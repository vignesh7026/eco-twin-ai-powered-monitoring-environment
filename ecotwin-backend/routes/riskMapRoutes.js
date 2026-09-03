const express = require("express");
const router = express.Router();

const { getCities } = require("../controllers/riskMapController");

router.get("/cities", getCities);

module.exports = router;
