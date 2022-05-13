const express = require('express');
const models = require('../models');

const router = express.Router();
const Op = models.Sequelize.Op;


router.get("/weather", async function (req, res) {
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
            // let header = [Object.keys(weather_data[0])]
            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=weather-data ${Date.now()}.csv`
            );
            let fname = '';
            res.sendFile('/temp/');
        } else {
            res.send(weather_data)    
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Internal Server Error" });
    }
    
});

router.get("/weather-csv", async function (req, res) {

});

module.exports = router;

const setDownloadHeaders = (reply) => {
    
};

const makeCSVheader = (obj) => Object.keys(obj).join(", ") + "\n";
const makeCSVrow = (obj) => Object.values(obj).join(", ") + "\n";
