

// 初始化聊天的状态
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};

// 加载socket 模块
var socketio = require('socket.io');

// exports 就相当于 给 chat_server.js 这个模板增加一个 模板的方法，类似 增加了 key 这个属性
// 对应value 值
// 详细:https://liuzhichao.com/p/1669.html
// http://www.cnblogs.com/pigtail/archive/2013/01/14/2859555.html
exports.listen = function(server){

  // 启动IO 服务器 允许它 搭载已有的 HTTP  服务器上
  io = socketio.listen(server);
  io.set('log level', 1);

  // 定义每个用户链接的处理逻辑
  io.sockets.on('connection', function (socket){

    //在用户连接上来时 赋予其一个访客名
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    // 在用户连接上来时 把他放入 聊天室 Lobby 里
    joinRoom(socket, 'Lobby');

    // 处理用户的消息更名， 以及聊天室的创建和更变
    handleMessageBroadcasting(socket, nickNames);

    handleNameChangeAttempts(socket, nickNames, namesUsed);

    handleRoomJoining(socket);

    



  });

};
