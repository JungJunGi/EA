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
    dstPort: 27016
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
    var query = { "meta.item": 'SUM_ACTIVE_POWER' };

    users.find({}).toArray(function (err, docs) {
        docs.forEach(element2 => {
            var companyURL = element2.company;
            if (companyURL.indexOf("(주)") != -1)
                companyURL = companyURL.replace("(주)", "")

            router.get('/heatmap/company=' + encodeURI(companyURL), (req, res) => {

                //python options
                var options = {
                    mode: 'json',
                    pythonPath: '',
                    scriptPath: './module/',
                    args: [element2.company]
                };

                //실시간 데이터 실행.
                PythonShell.run('test_realtime.py', options, function (err, results) {
                   
                });

                companyDB.collection(element2.company).find(query).toArray(function (findErr, data) {

                });
                return res.json();
            });
        });
    });
}

setTimeout(function () {
    start();
}, 2000);

module.exports = router;