const express = require("express");
const router = express.Router();

const { run } = require("../controllers/simulatorController");

router.post("/run", run);

module.exports = router;
