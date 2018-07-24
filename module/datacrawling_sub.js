/* 인하대학교 데이터 페이지 크롤링해오기 */
/* 김지연 */

const request = require('request');
const cheerio = require('cheerio');

const express = require("express");
var urlencode = require('urlencode');
var router = express.Router();

var res = new Array;

var company;    // company name
var dsid;       // company id
var category;   // data category
var depart = new Array;     // departs name
var myDate = new Array;     // date string


module.exports.findData = function (maindata, categoryNumber, companyName){

    company = companyName;
    category = categoryNumber;

    maindata.forEach(function(d, i){
        if (company == d[0]) {
            dsid = d[2];
            depart.push(d[1]);
        }

    });

    console.log(dsid, depart);

    

    // date info
    var today = new Date()      // today
    y = today.getFullYear();    // this year
    m = today.getMonth()+1;     // this month
    d = today.getDate();        // this date
    leapyear = false;           // is this year leap year?

    // data format : date -> string
    // today = today.toISOString().slice(0,10).replace("-","").replace("-","");

    if ((y%400==0) || (y%4==0 && y%100!=0)){    // 윤년 2월일때 29일까지
        leapyear = true;
    } else {                                    // 평년 2월일때 28일까지
        leapyear = false;
    }

    // 최근 6개월 간의 전기요금 차트 
    forlinechart(today, m)

    // 회사당 부서별 유효 전력량 차트
    forstackedareachart(today, y, m-1, d, leapyear)

}


// 최근 6개월 간의 전기요금 차트
function forlinechart(today, m) {

    for (var i = m; i>m-5; i--) {
        var a;

        if (i>9 || (i<1) && (i>-2))
            a = (today.getFullYear()-1).toString() + (12+i).toString() +"01";
        else 
            a = today.getFullYear().toString() + "0" + i.toString() +"01";

        // 과거데이터는 나중에 몽고디비에서 가져올 것이다!ㅜ
        dayData(category, a, company, depart, dsid, distbdid, false)
    }

    var a = today.toISOString().slice(0,10).replace("-","").replace("-","");
    dayData(category, a, company, depart, dsid, distbdid, true)

}



// forlinechart - 해당 회사, 해당 부서, 해당 날짜, 해당 데이터 뽑기
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

// forlinechart - json 형식으로
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
            responseJson(company, depart);
        

    });
    

}

// forlinechart - 데이터를 뿌려주기
function responseJson (company, depart) {

    var resJsonText

    resJsonText = " { \"meta\" : { \"company\" : \"" + company + "\", \"depart\" : \"" + depart + "\"}, "
                + "\"data\" : [ " + res + "] }";

    myJson = JSON.parse(resJsonText);

    router.get('/money', (req, res) => {  return res.json(myJson); });
}





// // 회사당 부서별 유효 전력량 차트 (한달)
// function forstackedareachart(today, y, m, d, leapyear) {

//     var today = today.toISOString().slice(0,10).replace("-","").replace("-","");
//     var my_count;

//     for(my_count=0; my_count<40; my_count++) {
//         var a;

//         if (m>=1 && m<10) {
//             a = y.toString() + "0" + m.toString();
        
//         } else {
//             if (m<1) {
//                 y = y - 1;
//                 m = m + 12;
//             }
//             a = y.toString() + m.toString();
//         }

//         if (d>=1 && d<10) {
//             a += "0";
//         } 

//         a += d.toString();
//         myDate.push(a);

//         if(a == today){
//             for(var i=1; i<=depart.length; i++) {
//                 checkData(dsid, i, a, true)
//                     //.then(AvgData_byDepart(depart[i-1]));
                
//                 //await AvgData_byDepart(depart[i-1]);
//             }
//             break;

//         } else {
//             for(var i=1; i<=depart.length; i++) {
//                 checkData(dsid, i, a, false);
//             }    
//         }

//         d++;

//         if ( (m == 2) && ( (leapyear && (d>29)) || (!leapyear && (d>28)) ) ) {
//             m = m + 1; d = 1;
//         } else if ( ( (m==4) || (m==6) || (m==9) || (m==11) ) && (d>30) ){
//             m = m + 1; d = 1;
//         } else if ( ( (m==1) || (m==3) || (m==5) || (m==7) || (m==8) || (m==10) ) && (d>31) ){
//             m = m + 1; d = 1;
//         } else if (m==12 && d>31) {
//             y = y + 1; m = 1; d = 1;
//         }
        
//     }
// }


// 회사당 부서별 유효 전력량 차트 (24시간)
function forstackedareachart(today, y, m, d, leapyear) {

    // today
    var today = today.toISOString().slice(0,10).replace("-","").replace("-","");

    // yesterday
    if(d == 1) {
        ym = m - 1;

        if( (m==3) && leapyear )
            yd = 29;
        else if ( (m==3) && !leapyear )
            yd = 28; 
        else if ( (m==5) || (m==7) || (m==10) || (m==12) )
            yd = 30;
        else if ( (m==1) || (m==2) || (m==4) || (m==6) || (m==8) || (m==9) || (m==11) )
            yd = 31;

    } else {
        ym = m; yd = d - 1;
    }

    if(ym == 0){
        yy = y - 1; ym = 1;
    } else {
        yy = y;
    }

    var yesterday = yy.toString();
    
    if (ym>=1 && ym<10) {
        yesterday += "0" + ym.toString();
    
    } else {
        yesterday += ym.toString();
    }

    if (yd>=1 && yd<10) {
        yesterday += "0";
    } 

    yesterday += yd.toString();



    // check today's & yesterday's data
    for(var i=1; i<=depart.length; i++) {

        checkData(dsid, i, today, true)
    
        checkData(dsid, i, yesterday, false);
    }   

}





// forstackedareachart - 해달 날짜에 데이터가 있는지 아니면 no result 인지 검사 
function checkData(dsid, distbdid, date, today) {

    url = "http://165.246.39.81:54231/demandList?date=" + date + "&category=" + category + "&DSID=" + dsid + "&DISTBDID=" + distbdid;

    await request(url, (error, response, body) => {
        if (error) throw url + error;

        let $ = cheerio.load(body);
        var jsonText;

        try {

            myBody = body.replace("<pre>\n", "").replace("\n</pre>", "");

            jsonText = " { \"meta\" : { \"company\" : \"" + company + "\", \"depart\" : \"" + depart[distbdid-1] + "\", "
                + "\"date\" : \"" + date + "\"}, " + "\"data\" : [ ";


            if (myBody == "No result") { // 해당 데이터 없음 !!!

                jsonText = jsonText + "] }";

            } else { // 데이터 있음 !!!

                myBody = myBody.split("\n");
                
                myBody.forEach(function(d, i, da) {
                    var a = d.split(",");
    
                    jsonText = jsonText + "{ \"time\" : \"" + new Date(a[0]) + "\", \"d\" : \"" + a[1] + "\" },";
                });

                jsonText = jsonText.slice(0, -1) + "] }";
            }
            
            
        }catch (error){
            
            console.error(error);
        }finally{

            var myJson = JSON.parse(jsonText);
            
            var str = urlencode(depart[distbdid-1]) + date;

            //console.log(str, myJson.meta)

            app.get('/'+str, (req, res) => {  return res.json(myJson); });

            
            
        }
    }); //request
/*
    if (today) {
        console.log(" **** ", date)
        AvgData_byDepart(depart[distbdid-1]);
    }
*/
}



// forstackedareachart - depart에 의해서 분류된 하루동안 데이터들의 평균 
function AvgData_byDepart(departName) {

    var cnt = myDate.length;   // 몇일동안의 데이터인지

    var jsonText = " { \"meta\" : { \"company\" : \"" + company + "\", \"depart\" : \"" + departName + "\"}, "
                   + "\"data\" : [ ";


    // 몇일동안
    for(var i=0;i<cnt;i++){

        var sum = 0.0;  // 하루동안 누적 유효전력
        var c = 0;    // 하루에 데이터 몇개인지
        var avg = 0.0;  // 하루 평균 유효전력
        
        var url = "http://localhost:8080/" + urlencode(departName) + myDate[i];

        request(url, (error, response, body) => {
            if (error) throw error;

            try {

                var myJson = JSON.parse(body);
                console.log(myJson.meta);

                c = myJson.data.length;

                if(c == 0) { // 데이터가 없다 !!!
                    
                } else {
                    // 하루동안의 각 데이터
                    for(var j=0; j<c; j++){

                        sum += parseInt(myJson.data[j].d);
                    }
                }

                avg = sum/c;

                console.log("avg ::::: " + avg);
                console.log();

                jsonText = jsonText + "{ \"date\" : \"" + myDate[i] + "\", \"d\" : \"" + avg + "\" },";

                sum = 0.0

            } catch (error) {
                //console.log(url + " ERROR !!!")
                //console.log(error)
                console.log(body)

            } finally {

                
            }

        });
    }

    jsonText = jsonText.slice(0, -1) + "] }";

    //myJson = JSON.parse(jsonText);
    //console.log(myJson);
}




// forstackedareachart
function responseJson_(){

    var jsonText = " { \"company\" : \"" + company + "\", \"depart\" : [ "

    for(var i=0; i<depart.length; i++) {
        jsonText += "\"" + depart[i] + "\","
    }

    jsonText = jsonText.slice(0, -1);
    jsonText += " ], \"st_date\" : \"" + myDate[0] + "\", \"end_date\" : \"" + myDate[myDate.length-1] + "\"}";

    //console.log(JsonText)




    var myJson = JSON.parse(jsonText);

    //console.log(myJson)

    app.get('/stackedarea', (req, res) => {  return res.json(myJson); });

    
    app.get('/main',function(req, res){

        fs.readFile('stackedarea_chart.html', function(error, data){
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
            console.log(data)
        });
    });
}





module.exports.router = router;