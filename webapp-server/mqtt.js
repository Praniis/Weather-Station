const mqtt = require('mqtt');
const models = require('./models');
const env = process.env.NODE_ENV || 'development';
const CONFIG = require(__dirname + '/config/app.json')[env];


const   HOST = CONFIG.MQTT_HOST,
        PORT = CONFIG.MQTT_PORT,
        MQTT_URL = `mqtt://${HOST}:${PORT}`;


const client = mqtt.connect(MQTT_URL, {
    username: CONFIG.MQTT_USERNAME,
    password: CONFIG.MQTT_PASSWORD,
    clientId: CONFIG.MQTT_CLIENT_ID,
    rejectUnauthorized: false,
    keepalive: 10,
    clean: false
});

client.on("error", (err) => {
    console.log("Error: " + err)
    if (err.code == "ENOTFOUND") {
        console.log("Network error, make sure you have an active internet connection")
    }
});

client.on("close", () => {
    console.log("Connection closed by client")
});

client.on("reconnect", () => {
    console.log("Client trying a reconnection")
});

client.on("offline", () => {
    console.log("Client is currently offline")
});


process.on('exit', function () {
    console.log("MQTT nodejs-server stopped");
    client.end();
});


client.on('connect', () => {
    console.log("MQTT nodejs-server started");
    client.subscribe('weather/raw-push', function () {
        console.log("Subcribed to topic weather/raw-push");
    });
});


client.on('message', function (topic, payload, packet) {
    switch (topic) {
        case 'weather/raw-push':
            handleWeatherData(payload)
    }
});


async function handleWeatherData(payload) {
    try {
        const msg = JSON.parse(payload.toLocaleString())
        var data = {
            dtime: new Date(msg.dtime*1000),
            temperature: msg.temperature || null,
            humidity: msg.humidity || null,
            wind_speed: msg.wind_speed || null,
            wind_degree: msg.wind_degree || null,
            wind_dir: msg.wind_dir || null,
            cloudcover: msg.cloudcover || null,
            pressure: msg.pressure || null,
            uv_index: msg.uv_index || null,
            coord: {
                type: 'Point',
                coordinates: [Number(msg.lat), Number(msg.lon)]
            },
            stime: new Date()
        }
        await models.weather_data.create(data);
    } catch (error) {
        console.error(error);
    }
}