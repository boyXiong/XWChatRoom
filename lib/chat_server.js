

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

    // 改变名称
    handleNameChangeAttempts(socket, nickNames, namesUsed);

    // 添加房间
    handleRoomJoining(socket);

    // 用户发出请求时，向其提供已经被占用的 聊天列表
    socket.on('rooms', function(){
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    // 定义断开链接后的，清除逻辑
    handleClientDisconnection(socket, nickNames, namesUsed);

  });

};


function assignGuestName(socket, guestNumber, nickNames, namesUsed){
  // 生产新的昵称
  var name = 'Guest' + guestNumber;
  // 这里说明每个socket 对象有一个 id 的属性
  nickNames[socket.id] = name;

  // 让用户知道他们的昵称，触发器 后面的是一个对象
  socket.emit('nameResult', {
    sucess : true,
    name : name
  });

  // 数组用的这个方法 push 添加数据
  namesUsed.push(name);

  // 返回当前连接的总个数
  return guestNumber + 1;
}


//进入聊天室
function joinRoom(socket, room) {

  // 让用户进入房间
  socket.join(room);

  // 记录用户的当前的房间 也就是socket 的 id 对于房间号
  currentRoom[socket.id] = room;

  // 触发这个事件 让用户知道他们进入了新的房间
  socket.emit('joinResult', {
    room : room
  });

  // 让房间里面的其他用户知道有新的用户
  socket.broadcast.to(room).emit('message', {

    text : nickNames[socket.id] + 'has joined' + room + '.'

  });

  // 确定哪些用户在房间里面
  var userInRoom = io.sockets.clients(room);

  if (userInRoom.length > 1) {

      var usersInRoomsSummary = 'Users currently in ' + room + ':';

      for (var index in userInRoom){

        var userSocketId = userInRoom[index].id;

        if (userSocketId != socket.id) {
          if (index > 0) {
            usersInRoomsSummary += ',';
          }
          usersInRoomsSummary += nickNames[userSocketId];
        }
      }

      usersInRoomsSummary += '.';
      // 将房间里其他用户的汇总发给这个用户
      socket.emit('message', {
        text: usersInRoomsSummary
      });
  }
}


// 改名
function handleNameChangeAttempts(socket, nickNames, namesUsed){

  // 添加nameAttempt 时间监听
  socket.on('nameAttempt', function(name){

    // 字符串的方法
    if (name.indexOf('Guest') == 0) {
      // 触发
      socket.emit('nameResult', {
        sucess: false,
        message: 'Names cannot begin with "Guest".'
      });

    }else{
      // 也就是没找到，所有没占用
      if (namesUsed.indexOf(name) == -1) {
        // 拿到之前的名称
        var perviousName = nickNames[socket.id];
        // 拿到存储在已经被用的名称的位置
        var previousNameIndex = namesUsed.indexOf(perviousName);
        // 存放进去
        namesUsed.push(name);
        // 删掉之前的 保持一个用户对应一个用户名
        delete namesUsed[previousNameIndex];
        // 触发响应
        socket.emit('nameResult', {
          sucess : true,
          name : name
        });

        // 告诉当前这个房间的用户
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + 'is now known as ' + name + '.'
        });

      }else{
        // 如果用户昵称已经被占用了
        socket.emit('nameResult', {
          sucess: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
}


// 消息转发 处理消息 广播
function handleMessageBroadcasting(socket){
  // 监听message 消息
  socket.on('message', function(message){
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ':' + message.text
    });
  })

}

// 加入到新的房间
function handleRoomJoining(socket){
  socket.on('join', function(room){
    //离开当前的对应的房间
    socket.leave(currentRoom[socket.id]);
    // 加入到新的房间
    joinRoom(socket, room.newRoom);
  })
}

// 用户断开连接
function handleClientDisconnection(socket){
  socket.on('disconnect', function(){
    // 拿到昵称
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    // 删除昵称
    delete namesUsed[nameIndex];
    // 删除昵称的编号
    delete nickNames[socket.id];

  });
}
