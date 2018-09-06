//전기요금 데이터 - mongodb연동

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var express = require("express");
var router = express.Router();

var tunnel = require('tunnel-ssh');
var PythonShell = require('python-shell'); //python 호출

var result, dateD = [];

//mongo ssh-tunneling option
var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27018
};

//python options
var options = {
    mode: 'json',
    pythonPath: '',
    scriptPath: './module/',
    args: ['골든팰리스']
};

//실시간 데이터 실행.
PythonShell.run('test_realtime.py', options, function (err, results) {
    if (err) throw err;

    console.log("실시간데이터 가져오기 from python")
    if (results == null)
        return;

    //console.log('results: %j', results);
    results.forEach(element => {
        
        if (element.meta.item == "ACCUMULATE_POWER_CONSUMPTION") {
            var year = new Date().getFullYear();
            var month = new Date().getMonth() + 1;
            var realtime = JSON.parse(element.data.slice(-1)[0]);
            realtime.date = year + "-" + month;
            dateD.push(realtime); //실시간 데이터와 연결시키기.

        }
    });
});

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

var server = tunnel(config, function (error, data) {
    if (error) {
        console.log("SSH connection error: " + error);
    }

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, database) {
        if (err) return;

        var db = database.db('companyData');
        var query = { "meta.item": "ACCUMULATE_POWER_CONSUMPTION" };

        db.collection('골든팰리스').find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;
            data.forEach(function (element) {
                console.log(element)

                // var jsonD = element.data[0];
                // var d = new Date(jsonD.date);
                // var year = new Date().getFullYear();
                // var month = new Date().getMonth() + 1;

                // if (element.meta.year == year && element.meta.month == month) { }
                // else {
                //     //다음달 1일이 전달 전기요금.

                //     if (d.getMonth() == 0) {//1월이면
                //         jsonD.date = (d.getFullYear() - 1) + "-12";
                //     }
                //     else if (d.getMonth() < 10) {
                //         jsonD.date = d.getFullYear() + "-0" + d.getMonth();
                //     }
                //     else {//1월이 아니면
                //         jsonD.date = d.getFullYear() + "-" + d.getMonth();
                //     }
                //     dateD.push(jsonD);
                // }

            });
            result = { "data": JSON.parse(JSON.stringify(groupBy(dateD, 'date', 'value'))) };


        });
    });
});

router.get('/seg2Data', (req, res) => {
    return res.json(result);
});

/*setTimeout(function () {
    server.close();
}, 2000)
*/

module.exports = router;