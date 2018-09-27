
var express = require("express");
var router = express.Router();
var PythonShell = require('python-shell'); //python 호출

var start = function (company, companyDB) {

    var companyURL = company;
    if (companyURL.indexOf("(주)") != -1)
        companyURL = companyURL.replace("(주)", "")

    router.get('/power/company=' + encodeURI(companyURL), (req, res) => {

        var dateD = [];

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

            console.log("역률데이터")
            if (results == null)
                return;

            results.forEach(element => {
                if (element.meta.item == "POWER_FACTOR") {
                    element.data.forEach(function (el, index) {
                        var jsonD = JSON.parse(el);
                        if (jsonD.value == 'None') {
                            jsonD.value = (Number(element.data[index - 1].value) + Number(element.data[index + 1].value)) / 2;
                        }
                        dateD.push({
                            date: jsonD.date,
                            depart: element.meta.depart,
                            value: jsonD.value
                        });

                    });
                }
            });


            return res.json({ data: dateD });

        });

    });

}


module.exports.start = start;
module.exports.router = router;