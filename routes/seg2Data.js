/* 회사의 모든 부서 - 5분 단위 전력 사용량 */
/* 김지연 */

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var express = require("express");
var router = express.Router();

var tunnel = require('tunnel-ssh');
var PythonShell = require('python-shell'); //python 호출

var result, dateD = [];

// mongo ssh-tunneling option
var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27019
};

// python options
var options = {
    mode: 'json',
    pythonPath: '',
    scriptPath: './module/',
    args: ['골든팰리스']
};


// 실시간 데이터 실행.
PythonShell.run('test_realtime.py', options, function (err, results) {
    if (err) throw err;

    console.log("실시간데이터 가져오기 from python")
    if (results == null)
        return;

    results.forEach(element => {
        
        if (element.meta.item == "ACCUMULATE_POWER_CONSUMPTION") {
            
            element.data.forEach(function (el){

                dateD.push(el)

            });

        }
    });
});


function groupBy(array, col, value) {

    var r = [], o = {};

    array.forEach(function (d) {
        if (!d[col]){
            console.log(d[col])
        }
        else {
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


var start = function (company, companyDB) { 

    router.get('/money/company=' + encodeURI(companyURL), (req, res) => {



    });
}


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

                element.data.forEach(function (el){
                    
                    dateD.push(el);
                    

                });
            });
            
            result = { "data": JSON.parse(JSON.stringify(groupBy(dateD, 'date', 'value'))) };

            // console.log(result)
            return result;

        });
    });
});

router.get('/seg2Data', (req, res) => {
    return res.json(result);
});

/*
setTimeout(function () {
    server.close();
}, 2000)
*/


// module.exports.start = start;
module.exports = router;