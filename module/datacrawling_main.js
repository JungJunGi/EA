/* 인하대학교 데이터 페이지 크롤링해오기 */
/* 김지연 */

const findData = require('./datacrawling_sub').findData;

const request = require('request');
const cheerio = require('cheerio');

var maindata = new Array();

module.exports.datacrawling = function (category, company){

request("http://165.246.39.81:54231/", (error, response, body) => {
        if (error) throw error;

        let $ = cheerio.load(body);

        try {
            $('a').each(function(i, e){
                let s = e.attribs.href;
                s = s.split("?");
                s = s[1].split("&");

                maindata.push(s);

                let company = s[0].split("=");
                s[0] = company[1];

                let depart = s[1].split("=");
                s[1] = depart[1];

                let dsid = s[2].split("=");
                s[2] = dsid[1];

                let distbdid = s[3].split("=");
                s[3] = distbdid[1];
            })

        } catch (error){
            console.error(error);
        }

        findData(maindata, category, company);  // category, company
        

    });
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

*/