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
    dstPort: 27018
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

    var query = { "meta.item": "ACCUMULATE_POWER_CONSUMPTION" };//누적사용량
    var users = database.collection('users');

    users.find({}).toArray(function (err, docs) {
        docs.forEach(element2 => {
            var dateD = [];
            var departD = [];

            //api만들때 (), 괄호가 들어가면 오류...그래서 ()떼고 만들기. 
            var companyURL = element2.company;
            if (companyURL.indexOf("(주)") != -1)
                companyURL = companyURL.replace("(주)", "")


            companyDB.collection(element2.company).find(query).toArray(function (findErr, data) {
                if (findErr) throw findErr;

                data.forEach(function (element) {

                    var jsonD = element.data.slice(-1)[0];
                    var d = new Date(jsonD.date);
                    var year = new Date().getFullYear();
                    var month = new Date().getMonth() + 1;

                    departD.push(element.meta.depart);

                    if (element.meta.year == year && element.meta.month == month) { }
                    else if (jsonD.date.indexOf("-01 00:") != -1) {

                        //다음달 1일이 전달 누적사용량.

                        if (d.getMonth() == 0) {//1월이면
                            jsonD.date = (d.getFullYear() - 1) + "-12";
                        }
                        //1월이 아니면
                        else if (d.getMonth() < 10) {
                            jsonD.date = d.getFullYear() + "-0" + d.getMonth();
                        }
                        else {
                            jsonD.date = d.getFullYear() + "-" + d.getMonth();
                        }

                        dateD.push(JSON.parse("{\"date\":\"" + jsonD.date + "\",\"" + element.meta.depart + "\":" + Number(jsonD.value) + "}"));
                    }
                    else {
                        if (d.getMonth() < 9) {
                            jsonD.date = d.getFullYear() + "-0" + (d.getMonth() + 1);
                        }
                        else {
                            jsonD.date = d.getFullYear() + "-" + (d.getMonth() + 1);
                        }
                        dateD.push(JSON.parse("{\"date\":\"" + jsonD.date + "\",\"" + element.meta.depart + "\":" + Number(jsonD.value) + "}"));
                    }

                });


            });

            
            router.get('/area/company=' + encodeURI(companyURL), (req, res) => {

                var year = new Date().getFullYear();
                var month = new Date().getMonth() + 1;

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

                    console.log("누적차트 실시간 데이터")
                    if (results == null)
                        return;

                    results.forEach(element => {

                        if (element.meta.item == "ACCUMULATE_POWER_CONSUMPTION") {
                   
                            var realtime = JSON.parse(element.data.slice(-1)[0]);

                            if (month < 10)
                                realtime.date = year + "-0" + month;

                            else
                                realtime.date = year + "-" + month;

                            //실시간 데이터와 연결시키기.
                            //이전에 넣은 실시간 데이터 제거.
                           dateD2.push(JSON.parse("{\"date\":\"" + realtime.date + "\",\"" + element.meta.depart + "\":" + Number(realtime.value) + "}"));

                        }
                    });


                    //부서명 중복 제거.
                    var uniq = departD.reduce(function (a, b) {
                        if (a.indexOf(b) < 0) a.push(b);
                        return a;
                    }, []);

                    //같은 날짜의 데이터끼리 groupBy
                    const mergedArray = Array.from(
                        dateD2.reduce(
                            (entryMap, e) => entryMap.set(e.date, { ...entryMap.get(e.date) || {}, ...e }),
                            new Map()
                        ).values()
                    );

                    return res.json({ "depart": uniq, "data": mergedArray });
                });

            });
        });
    });

}

setTimeout(function () {
    start();
}, 2000);

module.exports.start = start;
module.exports.router = router;