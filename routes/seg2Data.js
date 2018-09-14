/* 회사의 모든 부서 - 5분 단위 전력 사용량 */
/* 김지연 */

var express = require("express");
var router = express.Router();
var PythonShell = require('python-shell'); //python 호출

var result, dateD = [];

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

        var pre_date = new Date();
        pre_date.setDate(pre_date.getDate() - 365)//현재로 부터 일년 전

        /** Python Options **/
        var options = {
            mode: 'json',
            pythonPath: '',
            scriptPath: './module/',
            args: [company]
        };

        var query = { "meta.item": "SUM_ACTIVE_POWER" };

        /** From Maria DB **/
        PythonShell.run('test_realtime.py', options, function (err, results) {
            if (err) throw err;

            console.log("seg2데이터")
            if (results == null)
                return;

            results.forEach(element => {

                if (element.meta.item == "SUM_ACTIVE_POWER") {
                    element.data.forEach(function (el, index) {
                        el = JSON.parse(el);

                        if ((index == element.data.length - 1) && el.value != 'None')//하루 단위로..
                            dateD.push(el);
                        else {
                            if (index == 0) {
                                el.value = el.value;
                            }
                            else
                                el.value += element.data[index - 1].value;
                        }

                    });
                }
            });

            // result = { "data": JSON.parse(JSON.stringify(groupBy(dateD, 'date', 'value'))) };
            // console.log(result)
        });

        /** From Mongo DB **/
        companyDB.collection(company).find(query).toArray(function (err, data) {
            if (err) throw err;

            data.forEach(function (element) {

                element.data.forEach(function (el, index) {
                    if (new Date(el.date) > pre_date) {


                        if (el.date.indexOf("00:00:00") != -1 && el.value != 'None')//하루 단위로..
                            dateD.push(el);
                        else {
                            if (index == 0) {
                                el.value = el.value;
                            }
                            else
                                el.value += element.data[index - 1].value;
                        }

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