
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var tunnel = require('tunnel-ssh'); //ssh-tunneling
var PythonShell  = require('python-shell'); //python 호출
// var iconv  = require('iconv').Iconv; //인코딩 관련
var urlencode  = require('urlencode') //인코딩 관련

var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27017
};

var options = {
    mode:'text',
    pythonPath: '',
    scriptPath: '',
    args: ['코비스']
};

PythonShell.run('test_realtime.py', options, function (err, results) {
    if (err) throw err;

    console.log("From Python ::: ")
    results.forEach(element => {
        el =  JSON.parse(element.replace(/\'/gi, "\""))  // print(dd)
        console.log(el)

    });
});

/* 
@ python file
1. dd 말고 docD 으로
2. json.dumps() 없어도 됨?
*/



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
            /*console.log(data);
            
            //data parsing
            /*var mapdata = data.map(v => mymap(v));
            
            function mymap(v) {
                var data = v.data.map(function (v2) { return JSON.parse(v2);});
                var meta = v.meta;
                var result = {meta, data}
                
                return result;
            }
            
            
            data.forEach(function(element){
                console.log(element);
            });*/
            
        });
    });
});

// setTimeout(function () {
//     server.close();
// }, 2000)
