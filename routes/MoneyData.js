var express = require('express');
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (company, companyDB) {

    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/money/company=' + encodeURI(companyURL), (req, res) => {
        var result, dateD = [];

        var query = { "meta.item": "ELECTRIC_CHARGE" };

        realData(10, company, function (results) {
            if (results == null)
                return;

            results.forEach(element => {

                var year = new Date().getFullYear();
                var month = new Date().getMonth() + 1;
                var realtime = element.data.slice(-1)[0];

                if (month < 10)
                    realtime.date = year + "-0" + month;

                else
                    realtime.date = year + "-" + month;

                dateD.push(realtime);


            });
        });

        /** From Mongo DB **/
        companyDB.collection(company).find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;
            data.forEach(function (element) {

                var jsonD = element.data[0];
                var d = new Date(jsonD.date);
                var year = new Date().getFullYear();
                var month = new Date().getMonth() + 1;

                if (element.meta.year == year && element.meta.month == month) { }
                else { //다음달 1일이 전달 전기요금.

                    if (d.getMonth() == 0) { //1월이면
                        jsonD.date = (d.getFullYear() - 1) + "-12";
                    }
                    else if (d.getMonth() < 10) {
                        jsonD.date = d.getFullYear() + "-0" + d.getMonth();
                    }
                    else { //1월이 아니면
                        jsonD.date = d.getFullYear() + "-" + d.getMonth();
                    }
                    dateD.push(jsonD);
                }

            });
            result = { "data": JSON.parse(JSON.stringify(groupBy(dateD, 'date', 'value'))) };
            return res.json(result);
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


module.exports.start = start;
module.exports.router = router;