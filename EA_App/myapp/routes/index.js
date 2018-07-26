var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/mainpage', function(req, res, next) {
  res.render('dashboard', { title: 'main page' });
});

router.get('/MoneyLine', function(req, res, next) {
  res.render('MoneyLine', { title: 'money page' });
});

router.get('/category', function(req, res, next) {
  res.render('category', { title: 'bubble/pie page' });
});

router.get('/segmentation2', function(req, res, next) {
  res.render('segmentation2', { title: 'seg2 page' });
});

router.get('/pattern', function(req, res, next) {
  res.render('pattern', { title: 'elec pattern page' });
});
module.exports = router;
