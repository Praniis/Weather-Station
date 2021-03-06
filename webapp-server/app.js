const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const models = require('./models');

models.sequelize.sync().then(function () {
    const port = 8080
    app.listen(port, () => {
        console.log(`Server started on Port: ${port}`)
    });
});

app.use(cors({
    origin: '*'
}));
app.use(express.static('public'))
app.set('view engine', 'pug')
app.use(bodyParser.json());

// API Routes
app.use("/api/weather/", require("./routes/weather"));

// Page Routes
app.use("/", require("./routes"));


app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        console.log(err);
        res.status(err.status || 500);
        res.send({
            success: false,
            error: "Internal Server Error",
            err: err.stack
        });
    });
} else {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            success: false,
            error: "Internal Server Error"
        });
    })
}