

//防止恶意的攻击
function divEscapedContentElement(message){
  // ￥() 相当于一个宏 document.getElementById()
  // 这里就是 document.getElementById('<div></div>')
  return $('<div></div>').text(message);
}

function divSystemContentElement(message){

  return $('<div></div>').html('<i>' + message + '</i>');
}

// 处理用户的输入
function processUserInput(chatApp, socket){
    
  var message = $('#send-message').val();
  var systemMessage;

  //取出字符串的第0个字符, 作为命令
  if (message.charAt(0) == '/') {
    systemMessage = chatApp.procesCommand(message);

    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  }else {
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
}


//初始化

var socket = io.connect();

$(document).ready(function(){

  var chatApp = new Chat(socket);

  // 显示更名尝试的结果
  socket.on('nameResult', function(result){

    var message;

    if (result.success) {
      message = 'You are now known as ' + result.name + '.';
    }else{
      message = result.message;
    }

    $('#messages').append(divSystemContentElement(message));

  });

  // 显示房间变更
  socket.on('joinResult', function(result){
    $('#room').text(result.room);
    $('#messages').append(divEscapedContentElement('Room changed'));
  });

  //显示接收到的信息
  socket.on('message', function(message){
    var newElement = $('<div></div>').text(message.text);
    $('#messages').append(newElement);

  });

  // 显示房间可用列表
  socket.on('rooms', function(rooms){

    $('#room-list').empty();

    for (var room in rooms){

      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    //点击房间可以换到那个房间中
    $('#room-list div').click(function(){
      chatApp.procesCommand('/join' + $(this).text());
      $('#send-message').focus();
    });
  });

  //定期请求可用列表
  setInterval(function(){
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  $('#send-form').submit(function(){
    processUserInput(chatApp, socket);
    return false;
  });

});
