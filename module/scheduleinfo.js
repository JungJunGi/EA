
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
        addUser(database, paramId, paramPassword, paramCompany, function(err, result) {
            if (err) {throw err;}

            // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
            if (result && result.insertedCount > 0) {
                console.dir(result);

                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<head><script type="text/javascript">alert("가입을 축하드립니다. 로그인하세요."); window.location="/login/#signin"</script></head>');
                res.end();
            } else {  // 결과 객체가 없으면 실패 응답 전송
              res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
              res.write('<head><script type="text/javascript">alert("회원가입에 실패하였습니다. 다시 시도하세요."); window.location="/login/#signup"</script></head>');
              res.end();
            }
        });
    } else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }

  }
}


//사용자를 추가 함수
var addUser = function(database, id, password, company, callback) {
  console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + company);

  // users 컬렉션 참조
  var users = database.collection('users');

  //id 중복확인 후 사용자 추가
  users.find({"id":id}).toArray(function(err, docs) {
    if (err) { // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
        callback(err, null);
        return;
    }

    if (docs.length > 0 || !maindata.has(company)) {
        callback(null, null);

    } else { //중복된 id가 없거나 가입된 회사일 경우 사용자 추가
        users.insertMany([{"id":id, "password":password, "company":company}], function(err, result) {
            if (err) {  // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
                callback(err, null);
                return;
            }
          
            // 에러 아닌 경우, 콜백 함수를 호출하면서 결과 객체 전달
            if (result.insertedCount > 0) {
                console.log("사용자 레코드 추가됨 : " + result.insertedCount);
            } else {
                console.log("추가된 레코드가 없음.");
            }
            callback(null, result);
          
           });
        }
        
    });
  
}