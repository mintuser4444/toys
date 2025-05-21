// exports chatclient(), which, of course, is at the end of the file
var socket;
var chatbox;
var nick = "";
var room = document.location.pathname;

var iojs = document.createElement("script");
iojs.type = "text/javascript";
iojs.src = "/socket.io/socket.io.js";
iojs.onload = function(){
  socket = io();
  socket.on('connected', onconnected);
  socket.on('chat message', onchatmsg);
};
document.getElementsByTagName("head")[0].appendChild(iojs);

var onconnected = function(){
  socket.emit('room subscribe', {room: room, nick: nick});
}

var onchatmsg = function(msg){
  var chatr = document.createElement('tr');
  
  var td = document.createElement("td");
  td.classList.add("time");
  td.innerHTML = new Date(Number(msg.time)).toLocaleTimeString();
  chatr.appendChild(td);
  
  td = document.createElement("td");
  td.classList.add("nick");
  td.innerHTML = msg.nick;
  chatr.appendChild(td);
  
  td = document.createElement("td");
  td.classList.add("msg");
  td.innerHTML = msg.msg;
  chatr.appendChild(td);
  
  // I conjecture that even if hasChildNodes is false, .insertBefore will do the right thing
  if(chatbox.hasChildNodes())
    chatbox.insertBefore(chatr,chatbox.firstElementChild);
  else
    chatbox.appendChild(chatr);
}

var chatkeypress = function(e){
  if(e.keyCode === 13){ // haha yeah 13 that's a good plan
    var msg = e.target.value;
    if((msg.length > 2) && (msg[0] == '/') && (msg[1] != '/')){
      var s = msg.indexOf(' ');
      if(s != -1){
        var cmd = msg.substr(1,s-1);
        var param = msg.substr(s+1,msg.length);
        if(cmd == 'nick')
          socket.emit('nick', {nick: param});
        else
          alert('Unrecognized chat command: "' + cmd + '"');
      }
    }
    else
      socket.emit('chat message', {msg: msg});
    e.target.value = '';
    return false;
  }
  return true;
}

chatclient = function(chatline, inchatbox){
  chatline.onkeypress = chatkeypress;
  chatbox = document.createElement("table");
  inchatbox.appendChild(chatbox);
}
