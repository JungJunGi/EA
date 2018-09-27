var express = require('express');
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (company, companyDB) {

    var query = { "meta.item": "SUM_ACTIVE_POWER" };//누적사용량

    //api만들때 (), 괄호가 들어가면 오류...그래서 ()떼고 만들기. 
    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/area/company=' + encodeURI(companyURL), (req, res) => {
        var pre_date = new Date();
        pre_date.setDate(pre_date.getDate() - 365)//현재로 부터 일년 전

        var dateD = [];
        var departD = [];

        realData(16, company, function (results) {
            results.forEach(element => {

                element.data.forEach(function (el, index) {
                    if (el.value == 'None') {
                        el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                    }
                    dateD.push(JSON.parse("{\"date\":\"" + el.date + "\",\"" + element.meta.depart + "\":" + Number(el.value) + "}"));

                });

            });
        })

        companyDB.collection(company).find(query).toArray(function (findErr, data) {
            if (findErr) throw findErr;

            data.forEach(function (element) {

                departD.push(element.meta.depart);

                var pre_value = 0;
                element.data.forEach(function (el, index) {
                    if (new Date(el.date) > pre_date) {
                        if (el.value == 'None') {
                            el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                        }
                        dateD.push(JSON.parse("{\"date\":\"" + el.date + "\",\"" + element.meta.depart + "\":" + Number(el.value) + "}"));
                        /*if (index == 0) {
                            pre_value = Number(el.value);
                        }
                        else {
                            if (el.date.indexOf("00:00:00") != -1)//하루 단위로..
                            {
                                var a = Number(el.value);

                                dateD.push(JSON.parse("{\"date\":\"" + el.date + "\",\"" + element.meta.depart + "\":" + (Number(el.value) - pre_value) + "}"));
                                pre_value = a;
                            }
                        }*/

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