var express = require('express');
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (database, companyDB, company) {

    var user_query = {};

    var pre_date = new Date();
    pre_date.setDate(pre_date.getDate() - 365)//현재로부터 일년 전 

    var query = { "meta.item": "SUM_ACTIVE_POWER" };//누적사용량
    var users = database.collection('users');

    if (company != null) {

        user_query = { "company": company };
    }

    users.find(user_query).toArray(function (err, docs) {
        docs.forEach(element2 => {
            var dateD = [];

            //api만들때 (), 괄호가 들어가면 오류...그래서 ()떼고 만들기. 
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
                            dateD.push(JSON.parse("{\"date\":\"" + el.date + "\",\"" + element.meta.depart + "\":" + Number(el.value) + "}"));

                        }
                    });

                });

            });


            router.get('/area/company=' + encodeURI(companyURL), (req, res) => {

                var dateD2 = [];
                var departD = [];

                realData(16, element2.company, function (results) {
                    results.forEach(element => {

                        departD.push(element.meta.depart);
                        element.data.forEach(function (el, index) {
                            
                            if (el.value == 'None') {
                                el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                            }
                            dateD2.push(JSON.parse("{\"date\":\"" + el.date + "\",\"" + element.meta.depart + "\":" + Number(el.value) + "}"));

                        });

                    });
                    
                    dateD2 = dateD2.concat(dateD);
                    
                    //같은 날짜의 데이터끼리 groupBy
                    const mergedArray = Array.from(
                        dateD2.reduce(
                            (entryMap, e) => entryMap.set(e.date, { ...entryMap.get(e.date) || {}, ...e }),
                            new Map()
                        ).values()
                    );

                    return res.json({ "depart": departD, "data": mergedArray });
                });


            });

        });
    });
}


module.exports.start = start;
module.exports.router = router;