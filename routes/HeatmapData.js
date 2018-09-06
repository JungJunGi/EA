
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var express = require("express");
var router = express.Router();

var tunnel = require('tunnel-ssh');
var PythonShell = require('python-shell'); //python 호출

var result = [];
var arr = [];

//mongo ssh-tunneling option
var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27016
};
//python options
var options = {
    mode: 'json',
    pythonPath: '',
    scriptPath: './module/',
    args: ['(주)에이엔씨코리아']
};

//실시간 데이터 실행.
PythonShell.run('test_realtime.py', options, function (err, results) {
    if (err) throw err;

    console.log("실시간데이터 가져오기 from python")
    if (results == null)
        return;

    //console.log(result);
    results.forEach(function (element) {
        var da = element.data;
        var thisYear = new Date().getFullYear();
        //console.log(element.data)

        //data
        if (element.meta.year == thisYear) {
            da.forEach(function (ele) {
                var jsonD = JSON.parse(ele)
                if (jsonD.date.indexOf(':00:00') != -1) { //올해이고 정각이면
                    var d = new Date(jsonD.date).getDay();
                    var h = Number(jsonD.date.substring(11, 13));
                    if (h == 0) { h = 24; }
                    var val = Number(jsonD.value);

                    //요일, 시간, 부서, 값
                    arr.push({
                        day: d + 1,
                        hour: h,
                        depart: element.meta.depart,
                        value: val
                    });
                }
            });
        }
    });
});

var server = tunnel(config, function (error, data) {
    if (error) {
        console.log("SSH connection error: " + error);
    }
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, database) {
        if (err) {
            return;
        }
        var db = database.db('companyData');
        var query = { "meta.item": 'SUM_ACTIVE_POWER' };

        db.collection('(주)에이엔씨코리아').find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;

            data.forEach(function (element) {
                var da = element.data;
                var thisYear = new Date().getFullYear();

                //data
                if (element.meta.year == thisYear) {
                    da.forEach(function (ele) {
                        if (ele.date.indexOf(':00:00') != -1) { //올해이고 정각이면
                            var d = new Date(ele.date).getDay();
                            var h = Number(ele.date.substring(11, 13));
                            if (h == 0) { h = 24; }
                            var val = parseFloat(ele.value)

                            //요일, 시간, 부서, 값
                            arr.push({
                                day: d + 1,
                                hour: h,
                                depart: element.meta.depart,
                                value: val
                            });
                        }
                    });
                }
            });
            var re = groupBy(arr, 'day', 'hour', 'depart');
            result = groupBy(re, 'day', 'hour');

            result.sort(function (a, b) {
                if (a.day == b.day)
                    return a.hour > b.hour ? 1 : -1;
                else
                    return a.day > b.day ? 1 : -1;
            });
        });
    });
});

router.get('/heatmap', (req, res) => {
    return res.json({ "data": result });
});

module.exports = router;


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
                    var sum = 0; var val =
                        arr.map((ele) => {
                            if (ele.hour === item1 && ele.day === item && ele.depart === item2) {
                                sum += parseFloat(ele.value)
                                count++;
                            }
                        })
                    if (sum == 0.0) { val = 0.0; }
                    else { val = sum / count; }
                    count = 0;

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

/*
setTimeout(function () {
    server.close();
}, 2000)*/
