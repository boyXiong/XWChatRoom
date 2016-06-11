//加载模块

// http 模块
var http = require('http');
// 文件系统模块
var fs = require('fs');
// 文件路径模块
var path = require('path');
// 第三方 mime 模块， 根据文件的扩展名得到 MIME 类型的能力
var mime = require('mime');

// socket.io 模块
// var socketio = require('socket.io');

// 聊天服务器模块
var chatServer = require('./lib/chat_server');

// 这个其实是一个对象 用在缓存文件内容
var cache = {};

// 增加辅助函数
// 没有发现文件 404 报错
function send404(response){
  response.writeHead(404, {'Content-Type' : 'text/plain'});
  response.write('Error 404 : resource not found');
  response.end();
}

// 提供文件
function sendFile(response, filePath, fileContents){
  // 文件的头，表明200 成功 先写出正确的文件头，在添加内容
  response.writeHead(
    200,
    {"content-type" : mime.lookup( path.basename(filePath) )});

    response.end(fileContents);
}

// 提供静态文件服务 参数 1 响应， 2， 缓存， 3， 绝对路径
function serverStatic(response, cache, absPath) {
   // 1.检查文件是否缓存在内存中
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]); // 从内存返回文件
  }else {
    //2.检查文件是否存在与硬盘 这都不堵塞
    fs.exists(absPath, function(exists){
      // 如果存在
      if (exists) {
        // 读取数据
        fs.readFile(absPath, function(err, data){
          if (err) {
            send404(response);
          }else {
            // 存储到缓存 调试html 不存入到缓存
            // cache[absPath] = data;
            sendFile(response, absPath, data);
          }

        });
        // 如果不存在
      }else {
        send404(response);
      }

    })
  }
}



// 创建一个http 服务器对象 ， 回调函数有两个参数 请求和响应
var server = http.createServer(function(request, response) {
  var filePath = false;

  if (request.url == '/') {
    filePath = 'public/index.html'; // 如果是 根路径，就默认 HTML 文件
  }else{
    filePath = 'public' + request.url; // 将URL 路径转为文件的相对路径
  }

  // 当前的路径 拼接 要返回的路径
  var absPath = './' + filePath;
  // 返回静态文件
  serverStatic(response, cache, absPath);

});

// 初始化聊天的状态
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};



// 添加一个监听
chatServer.listen(server);

// 开启监听
server.listen(3000, function(){
  console.log("server listening on port 3000.");
});
