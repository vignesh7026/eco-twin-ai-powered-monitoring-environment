const axios = require("axios");

exports.currentWeather = async (req, res) => {
    try {
        const city = req.query.city;

        if (!city) {
            return res.status(400).json({
                message: "City is required"
            });
        }

        const response = await axios.get(
            "https://api.openweathermap.org/data/2.5/weather",
            {
                params: {
                    q: city,
                    appid: process.env.OPENWEATHER_API_KEY,
                    units: "metric"
                }
            }
        );

        res.status(200).json(response.data);

    } catch (error) {
        res.status(500).json({
            message:
                error.response?.data?.message ||
                error.message
        });
    }
};


exports.forecast = async (req, res) => {
    try {
        const city = req.query.city;

        if (!city) {
            return res.status(400).json({
                message: "City is required"
            });
        }

        const response = await axios.get(
            "https://api.openweathermap.org/data/2.5/forecast",
            {
                params: {
                    q: city,
                    appid: process.env.OPENWEATHER_API_KEY,
                    units: "metric"
                }
            }
        );

        res.status(200).json(response.data);

    } catch (error) {
        res.status(500).json({
            message:
                error.response?.data?.message ||
                error.message
        });
    }
};


exports.airQuality = async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                message: "Latitude and Longitude are required"
            });
        }

        const response = await axios.get(
            "https://api.openweathermap.org/data/2.5/air_pollution",
            {
                params: {
                    lat,
                    lon,
                    appid: process.env.OPENWEATHER_API_KEY
                }
            }
        );

        res.status(200).json(response.data);

    } catch (error) {
        res.status(500).json({
            message:
                error.response?.data?.message ||
                error.message
        });
    }
};