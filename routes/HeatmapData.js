var express = require('express');
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (database, companyDB, company) {

    var user_query = {};

    var pre_date = new Date();
    pre_date.setDate(pre_date.getDate() - 365)//현재로부터 일년 전

    var thisDay = new Date().getDay();
    if (thisDay == 0) { thisday = 7; }

    var users = database.collection('users');
    var query = { "meta.item": 'SUM_ACTIVE_POWER' };

    if (company != null) {

        user_query = { "company": company };
    }

    users.find(user_query).toArray(function (err, docs) {
        docs.forEach(element2 => {

            var result = [];
            var arr = [];
            var t_arr = [];

            var companyURL = element2.company;
            if (companyURL.indexOf("(주)") != -1)
                companyURL = companyURL.replace("(주)", "")

            companyDB.collection(element2.company).find(query).toArray(function (findErr, data) {

                if (findErr) throw findErr;

                data.forEach(function (element) {
                    element.data.forEach(function (ele, index) {
                        if (new Date(ele.date) > pre_date) {
                            var d = new Date(ele.date).getDay();
                            var h = Number(ele.date.substring(11, 13));
                            if (h == 0) { h = 24; }
                            if (d == 0) { d = 7; }

                            //요일, 시간, 부서, 값
                            if (ele.value == 'None') {
                                ele.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                            }

                            if (d != thisDay) {
                                arr.push({
                                    day: d,
                                    hour: h,
                                    depart: element.meta.depart,
                                    value: ele.value
                                });
                            }
                            else if (d == thisDay) {
                                t_arr.push({
                                    day: d,
                                    hour: h,
                                    depart: element.meta.depart,
                                    value: ele.value
                                });
                            }
                        }
                    });
                });

                var re = groupBy(arr, 'day', 'hour', 'depart');
                result = groupBy(re, 'day', 'hour');

            });

            router.get('/heatmap/company=' + encodeURI(companyURL), (req, res) => {

                var result2 = [];
                var arr2 = [];

                realData(16, element2.company, function (results) {
                    results.forEach(element => {

                        element.data.forEach(function (ele, index) {
                            var d = new Date(ele.date).getDay();
                            var h = Number(ele.date.substring(11, 13));
                            if (h == 0) { h = 24; }
                            if (d == 0) { d = 7; }

                            //요일, 시간, 부서, 값
                            if (ele.value == 'None') {
                                ele.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                            }
                            arr2.push({
                                day: d,
                                hour: h,
                                depart: element.meta.depart,
                                value: ele.value
                            });

                        });

                    });

                    arr2 = arr2.concat(t_arr);

                    var re = groupBy(arr2, 'day', 'hour', 'depart');
                    result2 = groupBy(re, 'day', 'hour');

                    result2 = result2.concat(result);

                    result2.sort(function (a, b) {
                        if (a.day == b.day)
                            return a.hour > b.hour ? 1 : -1;
                        else
                            return a.day > b.day ? 1 : -1;
                    });

                    return res.json({ "data": result2 });
                });

            });
        });

    });

}

var groupBy = (arr, day, hour, depart = '') => {
    var dayArr = [];
    var hourArr = [];
    var resultArr = [];

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