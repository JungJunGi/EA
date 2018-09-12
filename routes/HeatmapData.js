var express = require('express');
var router = express.Router();

var PythonShell = require('python-shell'); //python 호출

var start = function (company, companyDB) {

    var query = { "meta.item": 'SUM_ACTIVE_POWER' };

    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/heatmap/company=' + encodeURI(companyURL), (req, res) => {
        var result = [];
        var arr = [];

        var pre_date = new Date();
        pre_date.setDate(pre_date.getDate() - 365)//현재로 부터 일년 전


        /** Python Options **/
        var options = {
            mode: 'json',
            pythonPath: '',
            scriptPath: './module/',
            args: [company]
        };

        /** From Maria DB **/
        PythonShell.run('test_realtime.py', options, function (err, results) {
            if (err) throw err;

            console.log("히트맵 데이터")
            if (results == null)
                return;

            results.forEach(function (element) {
                var da = element.data;
                var thisYear = new Date().getFullYear();

                //data
                if (element.meta.item == query["meta.item"]) {

                    if (element.meta.year == thisYear) {
                        da.forEach(function (ele) {
                            var jsonD = JSON.parse(ele)

                            var d = new Date(jsonD.date).getDay();
                            var h = Number(jsonD.date.substring(11, 13));
                            if (h == 0) { h = 24; }
                            if (d == 0) { d = 7; }

                            //요일, 시간, 부서, 값
                            if (jsonD.value != 'None') {
                                arr.push({
                                    day: d,
                                    hour: h,
                                    depart: element.meta.depart,
                                    value: jsonD.value
                                });
                            }
                        });
                    }
                }
            });
        });

        /** From Mongo DB **/
        companyDB.collection(company).find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;

            data.forEach(function (element) {
                //var da = element.data;
                //var thisYear = new Date().getFullYear();

                //data
                //if (element.meta.year == thisYear) {
                element.data.forEach(function (ele) {
                    if (new Date(ele.date) > pre_date) {
                        var d = new Date(ele.date).getDay();
                        var h = Number(ele.date.substring(11, 13));

                        if (h == 0) { h = 24; }
                        if (d == 0) { d = 7; }

                        //요일, 시간, 부서, 값
                        if (ele.value != 'None') {
                            arr.push({
                                day: d,
                                hour: h,
                                depart: element.meta.depart,
                                value: ele.value
                            });
                        }
                    }
                });
                // }
            });

            var re = groupBy(arr, 'day', 'hour', 'depart');
            result = groupBy(re, 'day', 'hour');

            result.sort(function (a, b) {
                if (a.day == b.day)
                    return a.hour > b.hour ? 1 : -1;
                else
                    return a.day > b.day ? 1 : -1;
            });

            return res.json({ "data": result });
        });
    });

}

var groupBy = (arr, day, hour, depart = '') => {
    var dayArr = [];
    var hourArr = [];
    var resultArr = [];
    var count = 0;

    //day
    arr.map((item) => {
        var pushed = false;
        dayArr.map((ele) => {
            if (ele === item.day) {
                pushed = true;
            }
        })
        if (!pushed) {
            dayArr.push(item.day);
        }
    })
    //hour
    arr.map((item2) => {
        var pushed = false;
        hourArr.map((ele) => {
            if (ele === item2.hour) {
                pushed = true;
            }
        })
        if (!pushed) {
            hourArr.push(item2.hour);
        }
    })

    if (depart != '') {
        //depart
        dayArr.map((item) => {
            var departArr = [];

            arr.map((item3) => {
                var pushed = false;
                departArr.map((ele) => {
                    if (ele === item3.depart) {
                        pushed = true;
                    }
                })
                if (!pushed) {
                    departArr.push(item3.depart);
                }
            })

            hourArr.map((item1) => {
                departArr.map((item2) => {
                    var sum = 0; var count = 0; var val =
                        arr.map((ele) => {
                            if (ele.hour === item1 && ele.day === item && ele.depart === item2) {
                                //if (ele.value != 'None') {
                                sum += Number(ele.value)
                                count++;
                                //}
                            }
                        })
                    val = sum / count;

                    resultArr.push({
                        day: item,
                        hour: item1,
                        depart: item2,
                        value: val.toFixed(2)
                    })
                })
            })
        })
    }
    else {
        dayArr.map((item) => {

            hourArr.map((item1) => {
                var valuses = []; var val =
                    arr.map((ele) => {
                        if (ele.hour === item1 && ele.day === item) {
                            valuses.push({ "depart": ele.depart, "value": Number(ele.value) })
                        }
                    })
                resultArr.push({
                    "day": item,
                    "hour": item1,
                    "value": valuses
                })
            })

        })
    }
    return resultArr;
}

module.exports.start = start;
module.exports.router = router;