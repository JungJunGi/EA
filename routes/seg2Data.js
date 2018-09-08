var MongoClient = require('mongodb').MongoClient;
var databaseUrl = 'mongodb://localhost:27017';
var express = require('express');
var router = express.Router();

var tunnel = require('tunnel-ssh');
var cron = require('node-cron');

var PythonShell = require('python-shell'); //python 호출

var database, companyDB;
//mongo ssh-tunneling option
var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27019
};

// 데이터베이스 연결
var server = tunnel(config, function (error, data) {
    MongoClient.connect(databaseUrl, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;

        console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);

        database = db.db('local');
        companyDB = db.db('companyData');
    });
});

var start = function () {

    var users = database.collection('users');
    var query = { "meta.item": "ACCUMULATE_POWER_CONSUMPTION" };

    users.find({}).toArray(function (err, docs) {
        docs.forEach(element2 => {
            var result, dateD = [];

            var companyURL = element2.company;
            if (companyURL.indexOf("(주)") != -1)
                companyURL = companyURL.replace("(주)", "")


            companyDB.collection(element2.company).find(query).toArray(function (findErr, data) {


                if (findErr) throw findErr;

                data.forEach(function (element) {

                    element.data.forEach(function (el) {
                        if (el.date.indexOf(":00:00") != -1)
                            dateD.push(el);

                    });

                });
            });

            router.get('/seg2/company=' + encodeURI(companyURL), (req, res) => {

                var dateD2 = dateD;

                //python options
                var options = {
                    mode: 'json',
                    pythonPath: '',
                    scriptPath: './module/',
                    args: [element2.company]
                };

                //실시간 데이터 실행.
                PythonShell.run('test_realtime.py', options, function (err, results) {

                    if (err) throw err;

                    console.log("seg2 실시간 데이터")
                    if (results == null)
                        return;

                    results.forEach(element => {

                        if (element.meta.item == "ACCUMULATE_POWER_CONSUMPTION") {

                            element.data.forEach(function (el) {
                                el = JSON.parse(el);
                                if (el.date.indexOf(":00:00") != -1)
                                    dateD2.push(el)

                            });

                        }
                    });
                    result = { "data": JSON.parse(JSON.stringify(groupBy(dateD2, 'date', 'value'))) };

                    return res.json(result);
                });

            });
        });
    });
}

setTimeout(function () {
    start();
}, 2000);

function groupBy(array, col, value) {

    var r = [], o = {};

    array.forEach(function (d) {
        if (d[col]) {
            if (!o[d[col]]) {
                o[d[col]] = {};
                o[d[col]][col] = d[col];
                o[d[col]][value] = 0;
                r.push(o[d[col]]);
            }
            o[d[col]][value] += +d[value];
        }
    });

    return r;
};

module.exports = router;