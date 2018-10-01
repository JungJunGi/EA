var express = require('express');
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (company, companyDB) {

    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/seg4_data1/company=' + encodeURI(companyURL), (req, res) => {
        var dataD = [];

        realData(3, company, function (results) {
            results.forEach(element => {
                var realtime = element.data.slice(-1)[0];
                dataD.push({ "name": element.meta.depart, "value": realtime.value });

            });
            return res.json({ "data": dataD });
        })

    });
    router.get('/seg4_data2/company=' + encodeURI(companyURL), (req, res) => {
        var dataD = [];

        realData(17, company, function (results) {
            results.forEach(element => {
                var realtime = element.data.slice(-1)[0];
                dataD.push({ "name": element.meta.depart, "value": realtime.value });

            });
            return res.json({ "data": dataD });
        })

    });

}

module.exports.start = start;
module.exports.router = router;