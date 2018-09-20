var express = require('express');
var router = express.Router();

var PythonShell = require('python-shell'); //python 호출

var start = function (company, companyDB) {

    var query = { "meta.item": "ACCUMULATE_POWER_CONSUMPTION" };//누적사용량

    //api만들때 (), 괄호가 들어가면 오류...그래서 ()떼고 만들기. 
    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/area/company=' + encodeURI(companyURL), (req, res) => {
        var pre_date = new Date();
        pre_date.setDate(pre_date.getDate() - 365)//현재로 부터 일년 전

        var dateD = [];
        var departD = [];

        //python options
        var options = {
            mode: 'json',
            pythonPath: '',
            scriptPath: './module/',
            args: [company]
        };

        //실시간 데이터 실행.
        PythonShell.run('test_realtime.py', options, function (err, results) {
            if (err) throw err;

            console.log("부서별 누적 데이터")
            if (results == null)
                return;

            results.forEach(element => {
                var pre_value = 0;
                if (element.meta.item == "ACCUMULATE_POWER_CONSUMPTION") {
                    element.data.forEach(function (el, index) {
                        el = JSON.parse(el);

                        if (index == 0) {
                            pre_value = Number(el.value);
                        }
                        else {
                            if (index == element.data.length - 1)
                                dateD.push(JSON.parse("{\"date\":\"" + el.date + "\",\"" + element.meta.depart + "\":" + (Number(el.value) - pre_value) + "}"));

                        }

                    });
                }
            });
        });

        companyDB.collection(company).find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;

            data.forEach(function (element) {

                departD.push(element.meta.depart);

                var pre_value = 0;
                element.data.forEach(function (el, index) {
                    if (new Date(el.date) > pre_date) {

                        if (index == 0) {
                            pre_value = Number(el.value);
                        }
                        else {
                            if (el.date.indexOf("00:00:00") != -1)//하루 단위로..
                            {
                                var a = Number(el.value);

                                dateD.push(JSON.parse("{\"date\":\"" + el.date + "\",\"" + element.meta.depart + "\":" + (Number(el.value) - pre_value) + "}"));
                                pre_value = a;
                            }
                        }

                    }

                });


            });

            //부서명 중복 제거.
            var uniq = departD.reduce(function (a, b) {
                if (a.indexOf(b) < 0) a.push(b);
                return a;
            }, []);

            //같은 날짜의 데이터끼리 groupBy
            const mergedArray = Array.from(
                dateD.reduce(
                    (entryMap, e) => entryMap.set(e.date, { ...entryMap.get(e.date) || {}, ...e }),
                    new Map()
                ).values()
            );

            return res.json({ "depart": uniq, "data": mergedArray });
        });
    });

}


module.exports.start = start;
module.exports.router = router;