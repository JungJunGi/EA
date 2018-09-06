var express = require('express');
var fs = require('fs');
var router = express.Router();

const request = require('request');
const cheerio = require('cheerio');

//회사명 데이터 보내기.
const areaRouter = require('./AreaData').start,
    moneyLine = require('./MoneyData').start;
    heatmapRouter = require('./HeatmapData').start;

var MongoClient = require('mongodb').MongoClient,
    tunnel = require('tunnel-ssh');

var database;

// 데이터베이스 연결 정보
var databaseUrl = 'mongodb://localhost:27017';

//mongo ssh-tunneling option
var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27017
};

// 데이터베이스 연결
var server = tunnel(config, function (error, data) {
    MongoClient.connect(databaseUrl, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;

        console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);

        database = db.db('local');
    });
});

//===== 회사명 가져오기 =====//
var maindata = new Set(); //회사명 중복 제거.

request("http://165.246.39.81:54231/", (error, response, body) => {
    if (error) throw error;

    let $ = cheerio.load(body);

    try {
        $('a').each(function (i, e) {
            let s = e.attribs.href;
            s = s.split("?");
            s = s[1].split("&");

            let company = s[0].split("=");

            maindata.add(company[1]);
        })

    } catch (error) {
        console.error(error);
    }
});
/* GET login page. */
router.get('/login', function (req, res, next) {
    res.render('login', { title: 'login page' });
});

// 로그인 라우팅 함수 - 데이터베이스의 정보와 비교
router.route('/process/login').post(function (req, res) {

    // 요청 파라미터 확인
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword);

    // 데이터베이스 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
    if (database) {
        authUser(database, paramId, paramPassword, function (err, docs) {
            if (err) { throw err; }

            // 조회된 레코드가 있으면 성공 응답 전송//
            if (docs) {
                console.dir(docs);

                // 조회 결과에서 회사명
                var userCompany = docs[0].company;

                //회사명 넘겨주기. 새 js파일 생성 작성.
                var data = 'document.getElementById("userCompany").innerHTML =' + "'" + userCompany + "'" + ';';
                fs.writeFile('./public/javascripts/userCompany.js', data, 'utf8', function (err) {
                    if (err) throw err;

                });

                //로그인된 회사명 넘기기.
                moneyLine(userCompany);
                areaRouter(userCompany);
                heatmapRouter(userCompany);

                res.render('ourindex', { title: 'home page' });

            } else {  // 조회된 레코드가 없는 경우 실패 응답 전송
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<head><script type="text/javascript">alert("아이디 또는 패스워드가 틀립니다."); window.location="/login"</script></head>');
                res.end();
            }
        });
    } else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
        res.end();
    }

});

// 사용자 추가 라우팅 함수 - 클라이언트에서 보내오는 데이터를 이용해 데이터베이스에 추가
router.route('/process/adduser').post(function (req, res) {
    console.log('/process/adduser 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramCompany = req.body.company || req.query.company;

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramCompany);

    // 데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
    if (database) {
        addUser(database, paramId, paramPassword, paramCompany, function (err, result) {
            if (err) { throw err; }

            // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
            if (result && result.insertedCount > 0) {
                console.dir(result);

                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<head><script type="text/javascript">alert("가입을 축하드립니다. 로그인하세요."); window.location="/login/#signin"</script></head>');
                res.end();
            } else {  // 결과 객체가 없으면 실패 응답 전송
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<head><script type="text/javascript">alert("회원가입에 실패하였습니다. 다시 시도하세요."); window.location="/login/#signup"</script></head>');
                res.end();
            }
        });
    } else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }

});

// 사용자를 인증 함수
var authUser = function (database, id, password, callback) {
    console.log('authUser 호출됨 : ' + id + ', ' + password);

    // users 컬렉션 참조
    var users = database.collection('users');

    // 아이디와 비밀번호를 이용해 검색
    users.find({ "id": id, "password": password }).toArray(function (err, docs) {
        if (err) { // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
            callback(err, null);
            return;
        }

        if (docs.length > 0) {  // 조회한 레코드가 있는 경우 콜백 함수를 호출하면서 조회 결과 전달
            console.log('아이디 [%s], 패스워드 [%s] 가 일치하는 사용자 찾음.', id, password);
            callback(null, docs);
        } else {  // 조회한 레코드가 없는 경우 콜백 함수를 호출하면서 null, null 전달
            console.log("일치하는 사용자를 찾지 못함.");
            callback(null, null);
        }
    });
}

//사용자를 추가 함수
var addUser = function (database, id, password, company, callback) {
    console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + company);

    // users 컬렉션 참조
    var users = database.collection('users');

    //id 중복확인 후 사용자 추가
    users.find({ "id": id }).toArray(function (err, docs) {
        if (err) { // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
            callback(err, null);
            return;
        }

        if (docs.length > 0 || !maindata.has(company)) {
            callback(null, null);

        } else { //중복된 id가 없거나 가입된 회사일 경우 사용자 추가
            users.insertMany([{ "id": id, "password": password, "company": company }], function (err, result) {
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

module.exports = router;
