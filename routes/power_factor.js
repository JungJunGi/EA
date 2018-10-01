
var express = require("express");
var router = express.Router();

const realData = require('../module/datacrawling').main;

var start = function (company, companyDB) {

    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/power/company=' + encodeURI(companyURL), (req, res) => {

        var dateD = [];

        realData(15, company, function (results) {
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

}


module.exports.start = start;
module.exports.router = router;