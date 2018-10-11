/* 회사의 모든 부서 - 5분 단위 전력 사용량 */
/* 김지연 */

var express = require("express");
var router = express.Router();

const realData = require('../module/datacrawling').main;

function groupBy(array, col, value) {

    var r = [], o = {};

    array.forEach(function (d) {
        if (d[col]) {
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


var start = function (database, companyDB, company) {

    var user_query = {};

    var pre_date = new Date();
    pre_date.setDate(pre_date.getDate() - 365)//현재로부터 일년 전 

    var users = database.collection('users');
    var query = { "meta.item": "SUM_ACTIVE_POWER" };

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

                    element.data.forEach(function (el, index) {
                        if (new Date(el.date) > pre_date) {
                            if (el.value == 'None') {
                                el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                            }
                            dateD.push({"date":el.date,"depart":element.meta.depart,"value":el.value});

                        }

                    });

                });
            });

            router.get('/seg2/company=' + encodeURI(companyURL), (req, res) => {

                var dateD2 = [];

                realData(16, element2.company, function (results) {
                    results.forEach(element => {

                        element.data.forEach(function (el, index) {

                            if (el.value == 'None') {
                                el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                            }
                            dateD2.push({"date":el.date,"depart":element.meta.depart,"value":el.value});

                        });

                    })
                    dateD2 = dateD2.concat(dateD);
                    result = { "data": dateD2 };

                    return res.json(result);
                });
            });
        });
    });
}


module.exports.start = start;
module.exports.router = router;