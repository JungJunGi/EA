var express = require("express");
var router = express.Router();

var  MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var money,seg1,seg2,seg3_tag1,seg3_tag2,seg3_tag3,seg4_data1,seg4_data2,seg4_data3,seg4_data4;

//MongoDB connect
MongoClient.connect(url, function (err, database) {
   if (err) {
      return;
   }
   console.log('seg data 연결되었습니다.');
   var db = database.db('exp');
   
  db.collection('money').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    money = data;
  });
  db.collection('seg1').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg1 = data;
  });
  db.collection('seg2').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg2 = data;
  });
  db.collection('seg3_tag1').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg3_tag1 = data;
  });
  db.collection('seg3_tag2').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg3_tag2 = data;
  });
  db.collection('seg3_tag3').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg3_tag3 = data;
  });
  db.collection('seg4_data1').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg4_data1 = data;
  });
  db.collection('seg4_data2').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg4_data2 = data;
  });
  db.collection('seg4_data3').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg4_data3 = data;
  });
  db.collection('seg4_data4').findOne({}, function (findErr, data) {
    if (findErr) throw findErr;
    seg4_data4 = data;
  });

});

router.get('/money', (req, res) => {
  return res.json(money);
});
router.get('/seg1', (req, res) => {
  return res.json(seg1);
});
router.get('/seg2', (req, res) => {
  return res.json(seg2);
});
router.get('/seg3_tag1', (req, res) => {
  return res.json(seg3_tag1);
});
router.get('/seg3_tag2', (req, res) => {
  return res.json(seg3_tag2);
});
router.get('/seg3_tag3', (req, res) => {
  return res.json(seg3_tag3);
});
router.get('/seg4_data1', (req, res) => {
  return res.json(seg4_data1);
});
router.get('/seg4_data2', (req, res) => {
  return res.json(seg4_data2);
});
router.get('/seg4_data3', (req, res) => {
  return res.json(seg4_data3);
});
router.get('/seg4_data4', (req, res) => {
  return res.json(seg4_data4);
});

module.exports = router;