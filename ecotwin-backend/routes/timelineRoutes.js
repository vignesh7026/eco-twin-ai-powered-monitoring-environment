const express = require("express");
const router = express.Router();

const { getEvents } = require("../controllers/timelineController");

router.get("/events", getEvents);

module.exports = router;
