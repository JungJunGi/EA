var MongoClient = require('mongodb').MongoClient;
var databaseUrl = 'mongodb://localhost:27017';
var express = require('express');
var router = express.Router();

var tunnel = require('tunnel-ssh');

var PythonShell = require('python-shell'); //python 호출

var database, companyDB;
//mongo ssh-tunneling option
var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 20719
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
    router.use('/', express.static(__dirname + "/"));

    var users = database.collection('users');
    var query = { "meta.item": "ELECTRIC_CHARGE" };

    users.find({}).toArray(function (err, docs) {
        docs.forEach(element2 => {
            var companyURL = element2.company;
            if (companyURL.indexOf("(주)") != -1)
                companyURL = companyURL.replace("(주)", "")

            router.get('/money/company=' + encodeURI(companyURL), (req, res) => {
                var result, dateD = [];

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

                    console.log("실시간데이터 가져오기 from python")
                    if (results == null)
                        return;

                    //console.log('results: %j', results);
                    results.forEach(element => {

                        if (element.meta.item == "ELECTRIC_CHARGE") {
                            var year = new Date().getFullYear();
                            var month = new Date().getMonth() + 1;
                            var realtime = JSON.parse(element.data.slice(-1)[0]);
                            if (month < 10)
                                realtime.date = year + "-0" + month;

                            else
                                realtime.date = year + "-" + month;

                            dateD.push(realtime); //실시간 데이터와 연결시키기.

                        }
                    });
                });

                companyDB.collection(element2.company).find(query).toArray(function (findErr, data) {
                    if (findErr) throw findErr;
                    data.forEach(function (element) {

                        var jsonD = element.data[0];
                        var d = new Date(jsonD.date);
                        var year = new Date().getFullYear();
                        var month = new Date().getMonth() + 1;

                        if (element.meta.year == year && element.meta.month == month) { }
                        else {
                            //다음달 1일이 전달 전기요금.

                            if (d.getMonth() == 0) {//1월이면
                                jsonD.date = (d.getFullYear() - 1) + "-12";
                            }
                            else if (d.getMonth() < 10) {
                                jsonD.date = d.getFullYear() + "-0" + d.getMonth();
                            }
                            else {//1월이 아니면
                                jsonD.date = d.getFullYear() + "-" + d.getMonth();
                            }
                            dateD.push(jsonD);
                        }


                    });
                    result = { "data": JSON.parse(JSON.stringify(groupBy(dateD, 'date', 'value'))) };

                    return res.json(result);


                });
            });
        });
    });
}



function groupBy(array, col, value) {
    var r = [], o = {};
    array.forEach(function (a) {
        if (!o[a[col]]) {
            o[a[col]] = {};
            o[a[col]][col] = a[col];
            o[a[col]][value] = 0;
            r.push(o[a[col]]);
        }
        o[a[col]][value] += +a[value];
    });
    return r;
};

setTimeout(function () {
    start();
}, 2000);

module.exports = router;