const express = require('express');
const router = express.Router();

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/app.json')[env];

router.get('/', function (req, res) {
    res.render('home', {
        mapAPI: app.API["mapAPI"]
    });
});

module.exports = router;