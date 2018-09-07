var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var areaRouter = require('./routes/AreaData').router;
var heatmapRouter = require('./routes/HeatmapData').router;

// 전기요금 - line chart

var moneyLine = require('./routes/MoneyData').router;

// for seg2 chart
var a = require('./routes/seg2Data');

/*
var inha_main = require('./routes/inha_main');
var moneyLine_sub = require('./routes/moneyLine_sub').router;
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
//app.use('/segData', areaRouter);
//app.use('/moneyData', moneyLine);
//app.use('/heatmapData', heatmapRouter);
app.use('/a', a);

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
