const express = require("express");
const router = express.Router();

const { getDigitalTwin } = require("../controllers/digitalTwinController");

router.get("/", getDigitalTwin);

module.exports = router;
