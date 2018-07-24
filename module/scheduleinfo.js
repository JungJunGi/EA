
const async = require('async');
//const db = require('../module/pool.js');
var MongoClient = require('mongodb').MongoClient;
var database;


// 데이터베이스 연결 정보
var databaseUrl = 'mongodb://localhost:27017';
  
// 데이터베이스 연결
MongoClient.connect(databaseUrl, function(err, db) {
    if (err) throw err;

    console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);

    database = db.db('local');
});


//===== 회사명 가져오기 =====//
var maindata = new Set(); //회사명 중복 제거.

request("http://165.246.39.81:54231/", (error, response, body) => {
    if (error) throw error;

    let $ = cheerio.load(body);

    try {
      $('a').each(function(i, e){
          let s = e.attribs.href;
          s = s.split("?");
          s = s[1].split("&");

          let company = s[0].split("=");

          maindata.add(company[1]);
      });

    } catch (error){
      console.error(error);
    }
});


/*
module.exports = {
  // voting cnt 초기화 
  initscore : async () => {
    console.log("initscore!");
    try {
      let updatesql = 'UPDATE user SET voting_cnt = voting_cnt + 5';
      let resultsql = await db.queryParamCnt_Arr(updatesql);
    }
    catch(err) {
      console.log("mysql error! err log =>" + err);
      next(err);
    }
    finally {
    }
  },
  // 컨텐츠 score 계산
  contentsscore : async () => {
    console.log("calculate score start !");
    try{
      // 1. 오늘 올라온 게시물 score 계산 (조회수 + 좋아요 수) 
      var currentTime = new Date(); // 현재시간

      let selectsql =
      `
      SELECT *
      FROM contents
      `;
      let resultsql = await db.queryParamCnt_Arr(selectsql);

      for(var i=0; i<resultsql.length; i++){
        // 오늘 작성한 게시물일 경우
        if( (currentTime.getFullYear() == resultsql[i].writingtime.getFullYear()) && (currentTime.getMonth() == resultsql[i].writingtime.getMonth()) && (currentTime.getDate() == resultsql[i].writingtime.getDate()) ){
          // 좋아요 수 구하기
          let selectlike =
          `
          SELECT count(*) as cnt
          FROM contentsLike
          WHERE cl_contents_id = ?
          `;
          let likeresult = await db.queryParamCnt_Arr(selectlike, [resultsql[i].id]);

          // score update
          let updatesql =
          `
          UPDATE contents
          SET score = ? + ?
          WHERE id = ?
          `;
          let updateresult = await db.queryParamCnt_Arr(updatesql, [resultsql[i].views, likeresult[0].cnt, resultsql[i].id]);
        }
      }

      // 2. 모든 게시물 점수 30% 감소 
      let updatescore =
      `
      UPDATE contents
      SET score = score*0.7
      `;
      let resultscore = await db.queryParamCnt_Arr(updatescore);

      console.log("calculate score finish !");
    }
    catch(err) {
      console.log("mysql error! err log =>" + err);
      next(err);
    }
    finally {
    }
  }
};
*/


/* 매월 1일에 전기요금 과거데이터 몽고디비에 삽입 */
module.exports = {
  // 과거데이터 몽고디비에 삽입
  initscore : async () => {

    // 데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
    if (database) {
      insertData(database, company, function(err, result) {
            if (err) {throw err;}

            // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
            if (result && result.insertedCount > 0) {
                
            } else {  // 결과 객체가 없으면 실패 응답 전송
              
            }
        });
    } else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }

  }
}


// 과거데이터 삽입 함수
var insertData = function(database, company, callback) {

  // money 컬렉션 참조
  var money = database.collection('money');

  // company 확인
  money.find({"company":company}).toArray(function(err, docs) {

    // 에러 발생
    if (err) {
        callback(err, null);
        return;
        
    // 몽고디비에 해당 회사가 존재하면 그 객체에 과거데이터를 추가하여 갱신
    } else if (docs.length > 0) {
      // 
      // 
      callback(null, null);

    // 몽고디비에 해당 회사가 존재하지 않지만 유효한 회사라면 새로운 객체 생성하여 과거데이터 삽입
    } else if (maindata.has(company)){
      money.insertMany([{"company":company}], function(err, result) {
        if (err) {
            callback(err, null);
            return;
        }
      
        // 에러 아닌 경우, 콜백 함수를 호출하면서 결과 객체 전달
        if (result.insertedCount > 0) {
            console.log("레코드 추가됨 : " + result.insertedCount);
        } else {
            console.log("추가된 레코드가 없음.");
        }
        callback(null, result);
      
      });
    }
        
  });
  
}