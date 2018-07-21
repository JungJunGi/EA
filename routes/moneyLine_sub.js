//** 전기요금 - line chart **//

const request = require('request');
const cheerio = require('cheerio');

const express = require("express");
var router = express.Router();

var res = new Array;

module.exports.findData = function (maindata, category, company, depart){

    var dsid, distbdid;

    maindata.forEach(function(d, i){
        if (company == d[0] && depart == d[1]) {
            dsid = d[2];
            distbdid = d[3];
        }

    });

    console.log(dsid, distbdid);


    var today = new Date()
    t = today.getMonth()+1 //5
    
    for (i = t; i>t-5; i--) {
        var a;

        if (i>9 || (i<1) && (i>-2))
            a = (today.getFullYear()-1).toString() + (12+i).toString() +"01";
        else 
            a = today.getFullYear().toString() + "0" + i.toString() +"01";

        dayData(category, a, company, depart, dsid, distbdid, false)
    }

    var a = today.toISOString().slice(0,10).replace("-","").replace("-","");
    dayData(category, a, company, depart, dsid, distbdid, true)

}


function dayData(category, date, company, depart, dsid, distbdid, today) {
    
    url = "http://165.246.39.81:54231/demandList?date=" + date + "&category=" + category + "&DSID=" + dsid + "&DISTBDID=" + distbdid;
       
    var myBody, myData=[];
    var jsonText;
    var myJson;
     
    request(url, (error, response, body) => {
        if (error) throw error;

        let $ = cheerio.load(body);

        try {

            jsonText = " { \"meta\" : { \"company\" : \"" + company + "\", \"depart\" : \"" + depart + "\", "
                + "\"date\" : \"" + date + "\",\"category\" : \"" + category + "\"}, "
                + "\"data\" : [ ";

            myBody = body.replace("<pre>\n", "").replace("\n</pre>", "");
            myBody = myBody.split("\n");
            
            myBody.forEach(function(d, i, da) {
                var a = d.split(",");
                myData.push(a);

                jsonText = jsonText + "{ \"date\" : \"" + new Date(a[0]) + "\", \"d\" : \"" + a[1] + "\" },";
            });
            
        }catch (error){
            
            console.error(error);
        }finally{
            var str;

            jsonText = jsonText.slice(0, -1) + "] }";

            myJson = JSON.parse(jsonText);

            //console.log(myJson)

            if (today) {
                str = "RealTime"
                //console.log(str, myJson.data[myJson.data.length - 1]); // 지금시각 데이터    
                
            }
            else {
                var ym = parseInt( Number(date)/100 ) - 1
                var y = parseInt(ym/100)
                var m = parseInt(ym%100)
                str = 'money' + y + '-' + m
                //console.log(str, myJson.data[0]); // 0시0분 데이터
                
            }   



            router.get('/'+str, (req, res) => {  return res.json(myJson); });

            makeJson(company, depart, str);

        }
    });
    

}

function makeJson(company, depart, str) {
    
    url = "http://localhost:3000/moneyData/" + str;
     
    request(url, (error, response, body) => {
        if (error) throw error;

        var myJson = JSON.parse(body);
        var date;
        var d;

        if (str === "RealTime"){
            
            date = new Date(myJson.data[myJson.data.length - 1].date);
            
            d = myJson.data[myJson.data.length - 1].d;
            console.log(date, d)
            date.setMonth(date.getMonth()+1);

        } else {

            date = new Date(myJson.data[0].date);
            date.setMonth(date.getMonth());
            d = myJson.data[0].d
            console.log(date, d)
        }

        var month = date.getMonth();
        var year
        if (month == 0){
            month = 12
            year = date.getFullYear()-1;
        }
        else year = date.getFullYear();

        if(month < 10) month = "0" + month.toString()
        else month = month.toString()

        var s = "{\"date\" : \"" + year.toString() + "-" + month + "\", \"money\":" + d + "}"
        res.push(s);

        if (res.length > 5)
            responeJson(company, depart);
        

    });
    

}

function responeJson (company, depart){

    var resJsonText

    resJsonText = " { \"meta\" : { \"company\" : \"" + company + "\", \"depart\" : \"" + depart + "\"}, "
                + "\"data\" : [ " + res;

    resJsonText = resJsonText + "] }";

    //console.log(resJsonText)


    myJson = JSON.parse(resJsonText);

    //console.log(myJson)

    router.get('/money', (req, res) => {  return res.json(myJson); });

}

module.exports.router = router;