var compress   = require("compression");
var express    = require("express");
var mysql      = require('mysql2/promise');
var bodyParser = require("body-parser");
var md5        = require('MD5');
var logger     = require('winston');

var rtw = require('./rest_table_wrap.js');
var dbi = require('./rest_dbinfo_wrap.js');

var app = express();


/*
// logger to IRC..
logger.add(require('winston-irc'), {
   host: 'irc.freenode.net',
   nick: 'username', //FIXME
   pass: 'userpass', //FIXME
   channels: {
     '#cstmnet': true
  }
});
*/


var serverCtx = {};
serverCtx.env = process.env;
logger.info("setting up server.. ");


// db setup
var sqlhost = process.env.SQLHOST || 'localhost'; //FIXME
var sqldb   = process.env.SQLDB   || 'test'; //FIXME

var pool = require('mysql2/promise').createPool({
   connectionLimit: 100,
   host: sqlhost, 
   user: 'username', // FIXME
   password: 'userpass', // FIXME
   database: sqldb, 
   debug: false
});
serverCtx.pool = pool;


// setup app
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(compress());


// setup routers
var router = express.Router();
app.use('/api', router);

// add generic db info lookups
dbi(serverCtx, router, pool, md5);

// add your tables here - FIXME
// 1st field should be PK
rtw(serverCtx, router, pool, 'test1',    md5);
rtw(serverCtx, router, pool, 'document', md5);
rtw(serverCtx, router, pool, 'keyword',  md5);

// static content setup - use nginx if possible
app.use(express.static(__dirname + '/static'));
logger.info("server has static content in " + __dirname + "/static");

// handle everything else..
app.use(function(req, res, next) {
   var result = {};
   result.hasError = true;
   result.headers = req.headers;
   result.url = req.url;
   result.message = "Resource Not Found";
   result.status = 404;
   res.status = 404;
   res.json(result);
   logger.error(new Date() + ":" + JSON.stringify(result));
});



// start server
if (module === require.main) {
   var server = app.listen(process.env.PORT || 8080, function () {
      var port = server.address().port;
      logger.info('server is listening on port %s', port);
   });
}

module.exports = app;

