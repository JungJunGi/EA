
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var tunnel = require('tunnel-ssh'); // ssh-tunneling
var PythonShell  = require('python-shell'); // python 호출
var urlencode  = require('urlencode') // 인코딩 관련



/** Mongo ssh-tunneling Options **/
var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27017
};


/** Python Options **/
var options = {
    mode:'text',
    pythonPath: '',
    scriptPath: '',
    args: ['코비스']
};



// 실시간 데이터는 문자열로 올거야
// data.map(v => mymap(v)) 이거 필요해
PythonShell.run('test_realtime.py', options, function (err, results) {
    if (err) throw err;

    console.log("From Python ::: ")
    results.forEach(element => {
        el =  JSON.parse(element.replace(/\'/gi, "\""))  // print(dd)
        console.log(el)

    });
});



function mymap(v) {
    var data = v.data.map(function (v2) { return JSON.parse(v2);});
    var meta = v.meta;
    var result = {meta, data}
    
    return result;
}


// 몽고디비에서는 object 형식으로 올거야
// 바로 data.data.date 로 접근 가능해
var server = tunnel(config, function (error, data) {
    if (error) {
        console.log("SSH connection error: " + error);
    }
    MongoClient.connect(url,{ useNewUrlParser: true }, function (err, database) {
        if (err) {
            return;
        }
        var db = database.db('companyData_');
        var query = {"meta.year":"2018", "meta.month":"08", "meta.item":"ELECTRIC_CHARGE"};
        db.collection('(주)에이엔씨코리아').findOne(query, function (findErr, data) {
            if (findErr) throw findErr;
            // console.log(data);
            
            //data parsing
            /*
            var mapdata = data.map(v => mymap(v));
            
            data.forEach(function(element){
                console.log(element);
            });
            */
            
        });
    });
});



/** Set Timeout **/
// setTimeout(function () {
//     server.close();
// }, 2000)
