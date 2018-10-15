
/* 인하대학교 데이터 페이지 크롤링해오기 */
/* 김지연 */

const request = require('request');
const cheerio = require('cheerio');
var fs = require('fs');

var MongoClient = require('mongodb').MongoClient;
var tunnel = require('tunnel-ssh');
var schedule = require('node-schedule');


main(function(d){

})


async function main(callback) {

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

            var company = [];
            for( var companyName in dataSet ) {
                company.push(companyName)
            }

            schedule.scheduleJob({ second:20 }, async function(theDate){ // second  // hour: 23, minute: 59

                /** Mongo ssh-tunneling Options **/
                var databaseUrl = 'mongodb://localhost:27017';
                var mongo_info_file = fs.readFileSync('./config/mongo.json', 'utf8');
                var mongo_info = JSON.parse(mongo_info_file);

                var config = {
                    username: mongo_info['MONGO_USER'],
                    password: mongo_info['MONGO_PASS'],
                    host: mongo_info['MONGO_HOST'],
                    port: mongo_info['MONGO_PORT'],
                    dstPort: 27017
                };

                let today = new Date().toISOString().slice(0, 10).replace("-", "").replace("-", "");
                let categories = [3,5,6,7,8,9,10,11,12,13,14,15,16,17,21,22,23];


                /** 데이터베이스 연결 **/

                var server = await tunnel(config, function (error, data) {
                    MongoClient.connect(databaseUrl, { useNewUrlParser: true }, async function (err, db) {
                        if (err) throw err;

                        console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);

                        var database = db.db(mongo_info['MONGO_DB']);

                        company.forEach(async function(companyName){

                            // var collection = database.collection(companyName);

                            categories.forEach(async function(categoryNumber){

                                await getData(categoryNumber, companyName, today, dataSet[companyName], database.collection(companyName), async function (result) {
                                    
                                    // console.log(categoryNumber, companyName, dataSet[companyName], today)
/*
                                    if (result == null) {
                                        console.log("result is null");
                                        return;

                                    } else {
                                        console.log(result[0].meta)

                                        

                                        result.forEach(function (data) {

                                            isExist(collection, { "meta": data.meta }, async function (err, docs) {
                                                if (err) { throw err; }

                                                if (docs == null) {
                                                    //console.log("고로 생성한다!");

                                                    await addData(collection, data, async function (err, doc) {
                                                        if (err) { throw err; }
                                                    });

                                                    await addData(collection, { "meta": data.meta, "data": [] }, async function (err, doc) {
                                                        if (err) { throw err; }
                                                    });

                                                } else {
                                                    //console.log("고로 추가한다!");

                                                    did = docs[0]._id;
                                                    dd = data.data;

                                                    dd.forEach(function (d) {
                                                        collection.updateOne({ "_id":did}, {"$push":{"data":d} });
                                                    });
                                                }

                                            });

                                        }); // result forEach

                                    }
*/
                                }); // getData

                            }); // category forEach
                        }); // company forEach
                                
                    }); // mongodb
                }); // server

            }); // scheduling

        } // finally
    });
}


/** 해당 회사, 해당 부서, 해당 아이템 데이터 가져오기 **/
async function getData(categoryNumber, companyName, today, data, collection, callback) {

    var result = [];
    var category = checkCategory(categoryNumber);   // data category

    console.log(category, companyName)
    console.log(data)
    
    data.forEach(function (e) {

        var depart = Object.keys(e)[0];
        var id = Object.values(e)[0];

        var dsid = id[0];
        var distbdid = id[1];

        var myBody;
        var jsonText = "";
        var myJson;

        var url = "http://165.246.39.81:54231/demandList?date=" + today + "&category=" + categoryNumber + "&DSID=" + dsid + "&DISTBDID=" + distbdid;
        
        request(url, (error, response, body) => {

            try {

                if (response != undefined){

                    let $ = cheerio.load(response.body);

                    jsonText = "{ \"meta\" : { \"company\" : \"" + companyName + "\", \"depart\" : \"" + depart + "\", "
                        + "\"year\" : \"" + today.slice(0, 4) + "\",\"month\" : \"" + today.slice(4, 6) + "\",\"item\" : \"" + category + "\"}, "
                        + "\"data\" : [";
    
                    if (response.body.length > 100){
                        
                        myBody = body.replace("<pre>\n", "").replace("\n</pre>", "");
                        myBody = myBody.split("\n");
    
                        myBody.forEach(function (d, i, da) {
                            var a = d.split(",");
    
                            jsonText = jsonText + "{ \"date\" : \"" + new Date(a[0]) + "\", \"value\" : \"" + a[1] + "\" },";
    
                        });
                        
                        jsonText = jsonText.slice(0, -1) + "] }";
                        
                    } else {
                        jsonText = jsonText + "] }";
                    }
    
                    myJson = JSON.parse(jsonText);
        
                    result.push(myJson);
    
                }
            } catch (error) {

                console.log(error)
                // callback(null);
                
            } finally {

                console.log("result :::", data.length, result.length)

                if (data.length == result.length) {
                    result.forEach(function (data) {

                        // console.log(data.meta)

                        isExist(collection, { "meta": data.meta }, async function (err, docs) {
                            if (err) { throw err; }

                            console.log("뭐라도 해보자")
    
                            if (docs == null) {
                                console.log("고로 생성한다!");

                                await addData(collection, data, async function (err, doc) {
                                    if (err) { throw err; }
                                });

                                // await addData(collection, { "meta": data.meta, "data": [] }, async function (err, doc) {
                                //     if (err) { throw err; }
                                // });

                            } else {
                                console.log("고로 추가한다!");

                                did = docs[0]._id;
                                dd = data.data;

                                dd.forEach(function (d) {
                                    collection.updateOne({ "_id":did}, {"$push":{"data":d} });
                                });
                            }
    
                        });

                    }); // result forEach
                }

            } // finally

        });
    }); // data forEach (depart)
}



/** data category **/
function checkCategory(categoryNumber) {

    var category;

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


/** 데이터 존재 여부 확인 함수 **/
var isExist = function (collection, query, callback) {

    collection.find(query).toArray(function (err, docs) {
        if (err) {
            callback(err, null);
            return;
        }

        if (docs.length > 0) {
            console.log("존재한다 !!!");
            callback(null, docs);
        } else {
            console.log("존재하지 않는다 !!!");
            callback(null, null);
        }
    });

}

/** 데이터 추가 함수 **/
var addData = function (collection, data, callback) {

    collection.insertOne(data, function (err, result) {
        if (err) {
            callback(err, null);
            return;
        }

        callback(null, result);
    });
}

module.exports.main = main;