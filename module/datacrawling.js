
/* 인하대학교 데이터 페이지 크롤링해오기 */
/* 김지연 */

const request = require('request');
const cheerio = require('cheerio');

const express = require("express");
const async = require("async");
// var urlencode = require('urlencode');
// var router = express.Router();

var res = new Array;

var company;    // company name
var dsid;       // company id
var category;   // data category
var depart = new Array;     // departs name
var myDate = new Array;     // date string

function checkCategory(categoryNumber) {

    var category;   // data category

    switch (categoryNumber) {
        case 3: category = 'ACCUMULATE_POWER_CONSUMPTION'; break;
        case 5: category = 'AVERAGE_FREQUENCY'; break;
        case 6: category = 'AVERAGE_LINE_VOLTAGE'; break;
        case 7: category = 'AVERAGE_PHASE_CURRENT'; break;
        case 8: category = 'AVERAGE_PHASE_VOLTAGE'; break;
        case 9: category = 'AVERAGE_TEMPERATURE'; break;
        case 10: category = 'ELECTRIC_CHARGE'; break;
        case 11: category = 'INVERTER_CONVERSION_EFFICIENCY'; break;
        case 12: category = 'LINE_VOLTAGE_R_S'; break;
        case 13: category = 'LINE_VOLTAGE_S_T'; break;
        case 14: category = 'LINE_VOLTAGE_T_R'; break;
        case 15: category = 'POWER_FACTOR'; break;
        case 16: category = 'SUM_ACTIVE_POWER'; break;
        case 17: category = 'SUM_APPARENT_POWER'; break;
        case 21: category = 'SUM_REACTIVE_POWER'; break;
        case 22: category = 'AVERAGE_THD_PHASE_VOLTAGE'; break;
        case 23: category = 'AVERAGE_THD_PHASE_CURRENT'; break;
    }

    return category
}

/* 

data category

3: 누적전력량
5: 주파수
6: 선간전압
7: 상전류
8: 상전압
9: 부스바온도
10: 전기요금
11: 인버터효율
12: RS간 선간전압
13: ST간 선간전압
14: TR간 선간전압
15: 역률
16: 유효전력
17: 피상전력
21: 무효전력 
22: 전압 총고조파왜곡율
23: 전류 총고조파왜곡율

*/
async function main(categoryNumber, companyName, callback) {

    let today = new Date().toISOString().slice(0, 10).replace("-", "").replace("-", "");

    var maindata = [];
    var dataSet = {};

    request("http://165.246.39.81:54231/", async (error, response, body) => {
        if (error) throw error;

        let $ = await cheerio.load(body);

        try {
            $('a').each(function (i, e) {
                let s = e.attribs.href;
                s = s.split("?");
                s = s[1].split("&");

                var departDic = {};

                maindata.push(s);

                let company = s[0].split("=");
                s[0] = company[1];

                let depart = s[1].split("=");
                s[1] = depart[1];

                let dsid = s[2].split("=");
                s[2] = dsid[1];

                let distbdid = s[3].split("=");
                s[3] = distbdid[1];

                departDic[s[1]] = [s[2], s[3]];

                if (dataSet[s[0]] == null) {
                    dataSet[s[0]] = [];
                    dataSet[s[0]].push(departDic);
                } else {
                    dataSet[s[0]].push(departDic);
                }

            });

        } catch (error) {
            console.error(error);

        } finally {

            getData(categoryNumber, companyName, today, dataSet[companyName], function (result) {
                callback(result)
            });

        }

    });
}


/** 해당 회사, 해당 부서, 해당 아이템 데이터 가져오기 **/
async function getData(categoryNumber, companyName, today, data, callback) {

    var result = [];

    data.forEach(function (e, index) {

        var depart = Object.keys(e)[0];
        var id = Object.values(e)[0];

        var dsid = id[0];
        var distbdid = id[1];

        //console.log(depart)
        //console.log(dsid, distbdid)
        //console.log(today)

        url = "http://165.246.39.81:54231/demandList?date=" + today + "&category=" + categoryNumber + "&DSID=" + dsid + "&DISTBDID=" + distbdid;

        var myBody, myData = [];
        var jsonText;
        var myJson;

        request(url, (error, response, body) => {
            if (error) throw error
            let $ = cheerio.load(body);

            try {

                var category = checkCategory(categoryNumber);   // data category

                jsonText = " { \"meta\" : { \"company\" : \"" + companyName + "\", \"depart\" : \"" + depart + "\", "
                    + "\"year\" : \"" + today.slice(0, 4) + "\",\"month\" : \"" + today.slice(4, 6) + "\",\"item\" : \"" + category + "\"}, "
                    + "\"data\" : [ ";

                if (myBody == "No result") { // 해당 데이터 없음 !!!

                    jsonText = jsonText + "] }";

                } else { // 데이터 있음 !!!

                    myBody = body.replace("<pre>\n", "").replace("\n</pre>", "");
                    myBody = myBody.split("\n");

                    myBody.forEach(function (d, i, da) {
                        var a = d.split(",");
                        myData.push(a);

                        jsonText = jsonText + "{ \"date\" : \"" + new Date(a[0]) + "\", \"value\" : \"" + a[1] + "\" },";
                        // .toISOString().replace('T',' ').replace('.000Z','')
                    });
                }

            } catch (error) {

                console.error(error);
            } finally {


                jsonText = jsonText.slice(0, -1) + "] }";
                myJson = JSON.parse(jsonText);

                result.push(myJson);

                if (data.length == result.length) {
                    callback(result);
                }
            }

        });
    });
}

module.exports.main = main;