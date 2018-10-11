var express = require('express');
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (database, companyDB, company) {

    var user_query = {};

    var pre_date = new Date();
    pre_date.setDate(pre_date.getDate() - 365)//현재로부터 일년 전

    var query = { "meta.item": "ELECTRIC_CHARGE" };
    var users = database.collection('users');

    if (company != null) {

        user_query = { "company": company };
    }

    users.find(user_query).toArray(function (err, docs) {
        docs.forEach(element2 => {
            var result, dateD = [];

            var companyURL = element2.company;
            if (companyURL.indexOf("(주)") != -1)
                companyURL = companyURL.replace("(주)", "")

            companyDB.collection(element2.company).find(query).toArray(function (findErr, data) {

                if (findErr) throw findErr;

                data.forEach(function (element) {

                    var jsonD = element.data[0];
                    var d = new Date(jsonD.date);

                    //다음달 1일이 전달 전기요금.
                    if (d.getMonth() == 0) {//1월이면
                        jsonD.date = (d.getFullYear() - 1) + "-12";
                    }
                    else if (d.getMonth() < 10) {
                        jsonD.date = d.getFullYear() + "-0" + d.getMonth();
                    }
                    else {
                        jsonD.date = d.getFullYear() + "-" + d.getMonth();
                    }
                    dateD.push(jsonD);

                });

            });

            router.get('/money/company=' + encodeURI(companyURL), (req, res) => {

                var year = new Date().getFullYear();
                var month = new Date().getMonth() + 1;

                var dateD2 = [];

                realData(10, element2.company, function (results) {
                    results.forEach(element => {
                        var realtime = element.data.slice(-1)[0];

                        if (month < 10)
                            realtime.date = year + "-0" + month;

                        else
                            realtime.date = year + "-" + month;

                        dateD2.push(realtime);

                    });

                    dateD2 = dateD2.concat(dateD); //배열 병합.
                    result = { "data": JSON.parse(JSON.stringify(groupBy(dateD2, 'date', 'value'))) };

                    return res.json(result);
                })

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


module.exports.start = start;
module.exports.router = router;