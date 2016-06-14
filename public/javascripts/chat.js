// 处理聊天的命令

var Chat = function(socket){
  this.socket = socket;
};


// 发送消息处理函数
// prototye 相当于 oc 中的 isa 指针， 增加sendMessage 这个方法
Chat.prototype.sendMessage = function(room, text){

  var message = {
    room : room,
    text : text
  };
  this.socket.emit('message', message);
};

// 变更房间的函数
Chat.prototype.changeRoom = function(room){
  this.socket.emit('join', {
    newRoom : room
  });
};

// 处理聊天的命令
Chat.prototype.procesCommand = function(command) {
  // 分割
  var words = command.split(' ');
  // 从第一个单词开始 解析命令
  var command = words[0]
                    .substring(1, words[0].length)
                    .toLowerCase();
  var message = false;
  // 判断是什么命令
  switch (command) {
    case 'join':
      words.shift();  // 切换
      var room = words.join(' '); // 处理房间的变换/创建
      this.changeRoom(room);
      break;

    case 'nick':
      words.shift();  // 切换
      var name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;

    default:
      message = 'Unrecognized command.';   // 命令无法识别就返回错误
      break;
  }
  return message;
};
