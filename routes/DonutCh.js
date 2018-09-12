var express = require('express');
var router = express.Router();

var PythonShell = require('python-shell'); //python 호출

var start = function (company, companyDB) {

    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    //python options
    var options = {
        mode: 'json',
        pythonPath: '',
        scriptPath: './module/',
        args: [company]
    };

    router.get('/seg4_data1/company=' + encodeURI(companyURL), (req, res) => {
        var dataD = [];

        //실시간 데이터 실행.
        PythonShell.run('test_realtime.py', options, function (err, results) {

            if (err) throw err;

            console.log("seg4 실시간 데이터")
            if (results == null)
                return;

            results.forEach(element => {

                if (element.meta.item == "SUM_ACTIVE_POWER") {
                    var realtime = JSON.parse(element.data.slice(-1)[0]);
                    dataD.push({ "name": element.meta.depart, "value": realtime.value });
                }
            });

            /*
            {
                "name": "site_1",
                "id": "10512115",  
                "power_factor": 201340,
                "time_stamp": 241421214
            },
            */
            return res.json({ "data": dataD });
        });

    });
    router.get('/seg4_data2/company=' + encodeURI(companyURL), (req, res) => {
        var dataD = [];

        //실시간 데이터 실행.
        PythonShell.run('test_realtime.py', options, function (err, results) {

            if (err) throw err;

            console.log("seg4 실시간 데이터")
            if (results == null)
                return;

            results.forEach(element => {

                if (element.meta.item == "SUM_APPARENT_POWER") {
                    var realtime = JSON.parse(element.data.slice(-1)[0]);
                    dataD.push({ "name": element.meta.depart, "value": realtime.value });

                }
            });

            /*
            {
                "name": "site_1",
                "id": "10512115",  
                "power_factor": 201340,
                "time_stamp": 241421214
            },
            */
            return res.json({ "data": dataD });
        });

    });
}

module.exports.start = start;
module.exports.router = router;