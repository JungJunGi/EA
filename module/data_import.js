
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var tunnel = require('tunnel-ssh'); //ssh-tunneling
var PythonShell  = require('python-shell'); //python 호출

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
    // results is an array consisting of messages collected during execution
    console.log('results: %j', results);
});

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
            
            data.forEach(function(element){
                console.log(element);
            });*/
            
        });
    });
});

setTimeout(function () {
    server.close();
}, 2000)
