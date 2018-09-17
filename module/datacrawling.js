
/* 인하대학교 데이터 페이지 크롤링해오기 */
/* 김지연 */

const request = require('request');
const cheerio = require('cheerio');

const express = require("express");
const async = require("async");
// var urlencode = require('urlencode');
// var router = express.Router();

const crawling = require('./datacrawling_main').datacrawling;

var res = new Array;

var company;    // company name
var dsid;       // company id
var category;   // data category
var depart = new Array;     // departs name
var myDate = new Array;     // date string

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

*/

main(16, "신화개발")

async function main (categoryNumber, companyName){

    var maindata = [];
    var dataSet = {};
    
    request("http://165.246.39.81:54231/", async (error, response, body) => {
        if (error) throw error;

        let $ = await cheerio.load(body);

        try {
            $('a').each(function(i, e){
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

            let data = dataSet[companyName];

            let today = new Date().toISOString().slice(0,10).replace("-","").replace("-","");

            getData(categoryNumber, companyName, today, data);
        }

    }); 
}


/** 해당 회사, 해당 부서, 해당 아이템 데이터 가져오기 **/
function getData(categoryNumber, companyName, today, data) {

    for(var i in data){

        var depart = Object.keys(data[i])[0];
        var id = Object.values(data[i])[0];

        var dsid = id[0];
        var distbdid = id[1];
        
        console.log(depart)
        console.log(dsid, distbdid)
    
        url = "http://165.246.39.81:54231/demandList?date=" + today + "&category=" + categoryNumber + "&DSID=" + dsid + "&DISTBDID=" + distbdid;
        
        var myBody, myData=[];
        var jsonText;
        var myJson;

        request(url, (error, response, body) => {
            if (error) throw error;

            let $ = cheerio.load(body);

            try {

                jsonText = " { \"meta\" : { \"company\" : \"" + companyName + "\", \"depart\" : \"" + depart + "\", "
                    + "\"date\" : \"" + today + "\",\"category\" : \"" + categoryNumber + "\"}, "
                    + "\"data\" : [ ";

                if (myBody == "No result") { // 해당 데이터 없음 !!!

                    jsonText = jsonText + "] }";

                } else { // 데이터 있음 !!!

                    myBody = body.replace("<pre>\n", "").replace("\n</pre>", "");
                    myBody = myBody.split("\n");
                    
                    myBody.forEach(function(d, i, da) {
                        var a = d.split(",");
                        myData.push(a);

                        jsonText = jsonText + "{ \"date\" : \"" + new Date(a[0]) + "\", \"d\" : \"" + a[1] + "\" },";
                    });
                }
                
            } catch (error) {
                
                console.error(error);
            } finally {

                var str;

                jsonText = jsonText.slice(0, -1) + "] }";

                myJson = JSON.parse(jsonText);

                console.log(myJson)
    /*
                if (today) {
                    str = "RealTime"
                    // console.log(str, myJson.data[myJson.data.length - 1]); // 지금시각 데이터    
                    
                }
                else {
                    var ym = parseInt( Number(date)/100 ) - 1
                    var y = parseInt(ym/100)
                    var m = parseInt(ym%100)
                    str = 'money' + y + '-' + m
                    // console.log(str, myJson.data[0]); // 0시0분 데이터
                    
                }   

                // router.get('/'+str, (req, res) => {  return res.json(myJson); });

                makeJson(company, depart, str);
    */
            }
        });
    }

}

// module.exports.router = router;