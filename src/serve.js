var http = require('http');
var send = require('send');
var dir = __dirname;
var port = 3300;

console.log("serving on port",port,"from",dir);

var app = http.createServer(function(req, res){
  var url = req.url;

  // this is pretty base ... we assume routes don't have dots

  if (req.url.match(/^\/[^\.]*$/)) url = '/index.html';

  console.log("request:",req.url," --> serve:",url);

  send(req, dir+url).pipe(res);
}).listen(port);