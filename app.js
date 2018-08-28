var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var areaRouter = require('./routes/AreaData');

// 전기요금 - line chart
var moneyLine = require('./routes/MoneyData');
/*
var inha_main = require('./routes/inha_main');
var moneyLine_sub = require('./routes/moneyLine_sub').router;*/

/*
// 스케줄링 모듈
var schedule = require('node-schedule');

// 스케줄링 정보
var scheduleinfo = require('./module/scheduleinfo');

// 매일 23시59분30초에 스케줄링
var j = schedule.scheduleJob('30 59 23 * * *', function(){
  console.log("scheduling start!");
  //scheduleinfo.initscore();
  //scheduleinfo.contentsscore();
  console.log("scheduling finish!");
});
*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', userRouter);
app.use('/segData', areaRouter);
app.use('/moneyData', moneyLine);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createErrcor(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
