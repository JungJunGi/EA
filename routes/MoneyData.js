//전기요금 데이터 - mongodb연동

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var express = require("express");
var router = express.Router();

var tunnel = require('tunnel-ssh');
var PythonShell  = require('python-shell'); //python 호출

var result;

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
    mode:'text',
    pythonPath: '',
    scriptPath: './module/',
    args: ['삼성플랙스']
};

//실시간 데이터 실행.
PythonShell.run('test_realtime.py', options, function (err, results) {
    if (err) throw err;

    console.log("From Python ::: ")
    //console.log('results: %j', results);
    results.forEach(element => {
        el =  JSON.parse(element.replace(/\'/gi, "\""))  // print(dd)
        console.log(el)

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
        var query = { "meta.item": "ELECTRIC_CHARGE" };

        var dateD = [];

        db.collection('신화개발').find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;
             data.forEach(function (element) {
                var jsonD = element.data[0]

                 //해당 문자열 포함여부
                if (jsonD.date.indexOf("-01 00:00:00") != -1) {
                    //console.log(jsonD)
                    dateD.push(jsonD);
                }

            });

            result = {"data":JSON.parse(JSON.stringify(groupBy(dateD, 'date', 'value')))};

        });
    });
});

router.get('/money', (req, res) => {
    return res.json(result);
});

/*setTimeout(function () {
    server.close();
}, 2000)
*/
module.exports = router;