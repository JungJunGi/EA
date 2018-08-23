
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var tunnel = require('tunnel-ssh');

var config = {
    username: 'elec',
    password: 'vmlab347!',
    host: '203.252.208.247',
    port: 22,
    dstPort: 27017
};

var server = tunnel(config, function (error, data) {
    if (error) {
        console.log("SSH connection error: " + error);
    }
    MongoClient.connect(url,{ useNewUrlParser: true }, function (err, database) {
        if (err) {
            return;
        }

        
         //data parsing
         /*var mapdata = data.map(v => mymap(v));
            
         function mymap(v) {
             var data = v.data.map(function (v2) { return JSON.parse(v2);});
             var meta = v.meta;
             var result = {meta, data}
             
             return result;
         }*/


        var db = database.db('mongo');
        db.collection('신화개발').findOne({}, function (findErr, data) {
            if (findErr) throw findErr;
            console.log(data);
        });
    });
});

setTimeout(function () {
    server.close();
}, 2000)
