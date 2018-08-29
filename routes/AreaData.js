//area 데이터 - mongodb연동

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var express = require("express");
var router = express.Router();

var tunnel = require('tunnel-ssh');
var PythonShell = require('python-shell'); //python 호출

var result, dateD = [];;
var maindata = new Set();

var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27019
};

//python options
var options = {
    mode: 'json',
    pythonPath: '',
    scriptPath: './module/',
    args: ['삼성플랙스']
};

//실시간 데이터 실행.
PythonShell.run('test_realtime.py', options, function (err, results) {
    if (err) throw err;

    console.log("실시간데이터 가져오기 from python")
    if (results == null)
        return;

    results.forEach(element => {

        if (element.meta.item == "ACCUMULATE_POWER_CONSUMPTION") {
            var year = new Date().getFullYear();
            var month = new Date().getMonth() + 1;

            var realtime = JSON.parse(element.data.slice(-1)[0]);
            realtime.date = year + "-" + month;
            dateD.push(realtime); //실시간 데이터와 연결시키기.
            dateD.push(JSON.parse("{\"date\":\"" + realtime.date + "\",\"" + element.meta.depart + "\":" + Number(realtime.value) + "}")); //실시간 데이터와 연결시키기.
        }
    });
});

var server = tunnel(config, function (error, data) {
    if (error) {
        console.log("SSH connection error: " + error);
    }
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, database) {
        if (err) return;

        var db = database.db('companyData');
        var query = { "meta.item": "ACCUMULATE_POWER_CONSUMPTION" };//누적사용량

        var departD = [];

        db.collection('(주)가인디자인').find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;

            data.forEach(function (element) {

                var jsonD = element.data.slice(-1)[0];
                var d = new Date(jsonD.date);
                var year = new Date().getFullYear();
                var month = new Date().getMonth() + 1;

                maindata.add(element.meta.depart);

                if (element.meta.year == year && element.meta.month == month) { }
                else if (jsonD.date.indexOf("-01 00:") != -1) {
                    
                    //다음달 1일이 전달 누적사용량.

                    if (d.getMonth() == 0) {//1월이면
                        jsonD.date = (d.getFullYear() - 1) + "-12";
                    }
                    else if (d.getMonth() < 10) {
                        jsonD.date = d.getFullYear() + "-0" + d.getMonth();
                    }
                    else {//1월이 아니면
                        jsonD.date = d.getFullYear() + "-" + d.getMonth();
                    }

                    dateD.push(JSON.parse("{\"date\":\"" + jsonD.date + "\",\"" + element.meta.depart + "\":" + Number(jsonD.value) + "}"));
                }
                else {
                    if (d.getMonth() < 10) {
                        jsonD.date = d.getFullYear() + "-0" + (d.getMonth() + 1);
                    }
                    else {//1월이 아니면
                        jsonD.date = d.getFullYear() + "-" + (d.getMonth() + 1);
                    }
                    dateD.push(JSON.parse("{\"date\":\"" + jsonD.date + "\",\"" + element.meta.depart + "\":" + Number(jsonD.value) + "}"));
                }

            });

            maindata.forEach(function (element) {
                departD.push(element);
            });

            //같은 날짜의 데이터끼리 groupBy
            const mergedArray = Array.from(
                dateD.reduce(
                    (entryMap, e) => entryMap.set(e.date, { ...entryMap.get(e.date) || {}, ...e }),
                    new Map()
                ).values()
            );

            result = { "depart": departD, "data": mergedArray };

        });
    });
});

router.get('/area', (req, res) => {
    return res.json(result);
});

/*setTimeout(function () {
    server.close();
}, 2000)*/

module.exports = router;
