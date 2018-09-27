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


var start = function (company, companyDB) {

    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/seg2/company=' + encodeURI(companyURL), (req, res) => {

        var result, dateD = [];

        var pre_date = new Date();
        pre_date.setDate(pre_date.getDate() - 365)//현재로 부터 일년 전

        var query = { "meta.item": "SUM_ACTIVE_POWER" };

        realData(16, company, function (results) {
            results.forEach(element => {

                element.data.forEach(function (el, index) {

                    if (el.value == 'None') {
                        el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                    }
                    dateD.push(el);

                });

            })

        });

        /** From Mongo DB **/
        companyDB.collection(company).find(query).toArray(function (err, data) {
            if (err) throw err;
            var pre_value = 0;

            data.forEach(function (element) {
                element.data.forEach(function (el, index) {
                    if (new Date(el.date) > pre_date) {
                        if (el.value == 'None') {
                            el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                        }
                        dateD.push(el);

                    }

                });
            });

            result = { "data": JSON.parse(JSON.stringify(groupBy(dateD, 'date', 'value'))) };
            //console.log(result)
            return res.json(result);
        });
    });
}


module.exports.start = start;
module.exports.router = router;