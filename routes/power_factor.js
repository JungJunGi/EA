
var express = require("express");
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (database, companyDB, company) {

    var user_query = {};

    var users = database.collection('users');
    if (company != null) {

        user_query = { "company": company };
    }

    users.find(user_query).toArray(function (err, docs) {
        docs.forEach(element2 => {

            var companyURL = element2.company;
            if (companyURL.indexOf("(주)") != -1)
                companyURL = companyURL.replace("(주)", "")

            router.get('/power/company=' + encodeURI(companyURL), (req, res) => {

                var dateD = [];

                //실시간 데이터 실행.
                realData(15, element2.company, function (results) {
                    results.forEach(element => {

                        element.data.forEach(function (el, index) {
                            if (el.value == 'None') {
                                el.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                            }
                            dateD.push({
                                date: el.date,
                                depart: element.meta.depart,
                                value: el.value
                            });

                        });

                    })

                    return res.json({ data: dateD });

                });

            });
        });
    });

}


module.exports.start = start;
module.exports.router = router;