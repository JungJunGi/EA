//area 데이터 - mongodb연동

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var express = require("express");
var router = express.Router();

var tunnel = require('tunnel-ssh');

var result;
var maindata = new Set();

var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27019
};

var server = tunnel(config, function (error, data) {
    if (error) {
        console.log("SSH connection error: " + error);
    }
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, database) {
        if (err) return;

        var db = database.db('companyData');
        var query = { "meta.item": "ACCUMULATE_POWER_CONSUMPTION" };//누적사용량

        var dateD = [];
        var departD = [];
        
        db.collection('(주)가인디자인').find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;

            data.forEach(function (element) {
                
                var jsonD = element.data.slice(-1)[0];

                maindata.add(element.meta.depart);
                dateD.push(JSON.parse("{\"date\":\"" + jsonD.date + "\",\"" + element.meta.depart + "\":" + Number(jsonD.value) + "}"));

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
