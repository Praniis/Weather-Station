const fs = require('fs');
const express = require('express');
const models = require('../models');
const { format: csvFormater } = require('@fast-csv/format');

const router = express.Router();
const Op = models.Sequelize.Op;


router.get("/", async function (req, res) {
    try {
        if (!req.query.lat || !req.query.lon || !req.query.radius) {
            return res.send({ success: false, error: "Provide all necessary feilds" });
        }
        req.query.lon = Number(req.query.lon);
        req.query.lat = Number(req.query.lat);
    
        let whereStatement = [];
        if (req.query.sdate && req.query.edate) {
            whereStatement.push({
                dtime: {
                    [Op.between]: [new Date(req.query.sdate), new Date(req.query.edate)]
                }
            });
        }
    
        let location = models.Sequelize.literal(`ST_GeomFromText('POINT(${req.query.lat} ${req.query.lon})')`);
        let distance = models.Sequelize.fn('ST_DistanceSphere', models.Sequelize.literal('coord'), location);
    
        whereStatement.push(models.Sequelize.where(distance, { [Op.lte]: Number(req.query.radius) }));
    
        let weather_data = await models.weather_data.findAll({
            attributes: [
                "dtime", "temperature", "humidity",
                "wind_speed", "wind_degree", "wind_dir",
                "cloudcover", "pressure", "uv_index",
                "coord"
            ],
            where: whereStatement,
            raw: true
        });
        if (req.query.resType == 'csv') {
            const stream = csvFormater({ headers: true });
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=WeatherData-${Date.now()}.csv`);
            stream.pipe(res);
            let csvData = [];
            for (let i = 0; i < weather_data.length; i++) {
                csvData.push({
                    dtime: new Date(weather_data[i].dtime).toISOString(),
                    temperature: weather_data[i].temperature,
                    humidity: weather_data[i].humidity,
                    wind_speed: weather_data[i].wind_speed,
                    wind_degree: weather_data[i].wind_degree,
                    wind_dir: weather_data[i].wind_dir,
                    cloudcover: weather_data[i].cloudcover,
                    pressure: weather_data[i].pressure,
                    uv_index: weather_data[i].uv_index,
                    lat: weather_data[i].coord.coordinates[0],
                    lon: weather_data[i].coord.coordinates[1]
                });
                stream.write(csvData[i]);
            }
            stream.end();
        } else {
            res.send({ success: false, error: "No Data" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Internal Server Error" });
    }
    
});

router.get("/lastData", async function (req, res) {
    // if (!req.query.lat || !req.query.lon || !req.query.radius) {
    //     return res.send({ success: false, error: "Provide all necessary feilds" });
    // }
    req.query.lon = Number(req.query.lon);
    req.query.lat = Number(req.query.lat);

    let whereStatement = [];
    if (req.query.sdate && req.query.edate) {
        whereStatement.push({
            dtime: {
                [Op.between]: [new Date(req.query.sdate), new Date(req.query.edate)]
            }
        });
    }
    if (req.query.lon && req.query.lat) {
        let location = models.Sequelize.literal(`ST_GeomFromText('POINT(${req.query.lat} ${req.query.lon})')`);
        let distance = models.Sequelize.fn('ST_DistanceSphere', models.Sequelize.literal('coord'), location);
        whereStatement.push(models.Sequelize.where(distance, { [Op.lte]: Number(req.query.radius) }));
    }

    let weather_data = await models.weather_data.findOne({
        attributes: [
            "dtime", "temperature", "humidity",
            "wind_speed", "wind_degree", "wind_dir",
            "cloudcover", "pressure", "uv_index",
            "coord"
        ],
        where: whereStatement,
        order: [[
            "id", "desc"
        ]],
        limit: 1,
        raw: true
    });

    if (weather_data) {
        res.send({
            dtime: weather_data.dtime,
            temperature: "" + weather_data.temperature,
            humidity: "" + weather_data.humidity,
            wind_speed: weather_data.wind_speed,
            wind_degree: weather_data.wind_degree,
            wind_dir: weather_data.wind_dir,
            cloudcover: weather_data.cloudcover,
            pressure: weather_data.pressure,
            uv_index: weather_data.uv_index,
            lat: weather_data.coord.coordinates[0],
            lon: weather_data.coord.coordinates[1]
        });
    } else {
        res.send({});
    }
});

module.exports = router;
