
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

  var message = $('#send=message').val();
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
