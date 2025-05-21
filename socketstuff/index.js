// Express, MongoDB, socket.io
var app = require('express')();
app.disable('x-powered-by'); // to prevent attacks targeted at the framework
var http = require('http').Server(app);
const multiparty = require('multiparty');
var io = require('socket.io')(http);
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
var assert = require('assert');


/////////////////////// hml library
const hml = {};
{
  const makeSpace = (indent) => ''.padEnd(2*indent);
const element = (name, params, childs) => {
  if(childs === undefined && Array.isArray(params)){
    childs = params;
    params = undefined;
  }
  return {name, params, childs, render: function(){return render(this)}};
};
const render = (element, indent=0, buffer) => {
  //console.log('rendering at indent', indent, element.name);
  const newBuffer = !buffer;
  if(newBuffer){
    buffer = [];
  }
  if(typeof element == 'string'){
    buffer.push(makeSpace(indent) + element);
  } else {
    const {name, params, childs} = element;
    let paramText = params ? Object.keys(params).map(p=>` ${p}=${JSON.stringify(params[p])}`).join('') : '';
    const startTag = `<${name}${paramText}>`;
    const endTag = `</${name}>`;
    if(childs?.length){
      buffer.push(makeSpace(indent) + startTag);
      childs.forEach(child => render(child, indent+1, buffer));
      buffer.push(makeSpace(indent) + endTag);
    } else {
      buffer.push(makeSpace(indent) + startTag + endTag);
    }
  }
  if(newBuffer){
    return buffer.join('\n');
  }
}
Object.assign(hml, {
  element,
  render
});
['html','head','body','b','i','p','title','select','option','form','button','input','textArea'].forEach(key => hml[key] = (params, childs) => element(key, params, childs));
}

// used to attach the debugger
var net = require('net');
var repl = require('repl');
var fs = require('fs');
var path = require('path');

var port = process.env.PORT || 8080;

__dirname = process.cwd()+"/";

let dbPromiseResolve;
let dbPromise = new Promise(res=>dbPromiseResolve=res);
let actualDb;
const dbPath = 'data.db';
const dbExists = fs.existsSync(dbPath);
sqlite.open({filename: dbPath, driver: sqlite3.Database}).then(
  async theDb => {
    actualDb = theDb;
    if(!dbExists){
      await createDb()
    }
    dbPromiseResolve(true);
  }
)
const db = {};
['get','all','exec','run'].forEach(method=>{
  db[method] = async(sql,...args) => {
    console.log('running sql',sql,...args);
    try {
      return await actualDb[method](sql,...args);
    } catch(err) {
      console.log('sql statement', sql, ...args);
      throw err;
    }
  }
});

const createDb = async () => {
  await db.exec(`CREATE TABLE chats (
    msg TEXT,
    nick TEXT,
    room TEXT,
    time NUMBER
  );`);
}


var socketdata = [];
io.on('connection', function(socket){
  console.log('socket connection:' + socket);
  var socketdatai = {socket: socket, nick: '', room: ''};
  socketdata.push(socketdatai);  

  socket.on('room subscribe', async function(msg){
    socketdatai.room = msg.room;
    const myChats = await db.all('SELECT * FROM chats WHERE room=?;',msg.room);
    myChats.forEach(doc => {
      console.log('sending old chats: ' + doc.msg);
      socket.emit('chat message', {msg:  doc.msg,
                                   nick: doc.nick,
                                   time: doc.time});
    });
    console.log('room subscribe: ' + socketdatai.nick + '->' + socketdatai.room);
  });

  socket.on('nick', function(msg){
    var oldnick = socketdatai.nick;
    socketdatai.nick = msg.nick;
    if(socketdatai.room != '' && oldnick != ''){
      roommsg({room: socketdatai.room,
               nick: oldnick,
               msg: "nick change to " + msg.nick,
               time: Date.now()});
    };
    console.log('nick change: ' + oldnick + ' →  ' + msg.nick);
  });


  socket.on('disconnect', function(){
    var nick = socketdatai.nick;
    var room = socketdatai.room;
    if(nick == '')
      nick = 'someone';
    if(room == '')
      room = 'nowhere';
    var time = Date.now();
    var i = socketdata.indexOf(socketdatai);
    socketdata.splice(i,1);
    roommsg({room: room, nick: nick, msg: "disconnected", time: time});
    console.log(nick + ' disconnected from ' + room + " at " + time);
  });

  socket.on('chat message', async function(msg){
    smsg = {msg: msg.msg,
            nick: socketdatai.nick,
            room: socketdatai.room,
            time: Date.now()};
    await db.run('INSERT INTO chats VALUES (?,?,?,?);',[smsg.msg,smsg.nick,smsg.room,smsg.time]);
    roommsg(smsg);
    console.log('chat message: ['+smsg.room+']['+smsg.time+']['+smsg.nick+']: '+smsg.msg);
  });

  socket.emit('connected', '');
});

var roommsg = function(msg){
  for(var i=0; i<socketdata.length; i++){
    if(socketdata[i].room == msg.room)
      socketdata[i].socket.emit('chat message', msg);
  }
}

statics = {
  "/": __dirname+"socketstuff/index.html",
  "/turtlepond.js": __dirname+"turtlepond/turtlepond.js",
  "/turtle.png": __dirname+"turtlepond/turtle.png",
  "/fish.png": __dirname+"turtlepond/fish.png",
  "/turtlepond/turtle512.png": __dirname+"turtlepond/turtle512.png",
  "/turtlepond/fish128.png": __dirname+"turtlepond/fish128.png",
  "/domtetris.html": __dirname+"domtetris/domtetris.xhtml",
  "/tetris.css": __dirname+"domtetris/tetris.css",
  "/tetris.js": __dirname+"domtetris/tetris.js",
  "/chatclient.js": __dirname+"socketstuff/chatclient.js",
  "/fractal.html": __dirname+"fractal.html",
  "/fractal-webgl.html": __dirname+"fractal-webgl.html",
  "/fragment.html": __dirname+"fragment.html",
  "/gravity.html": __dirname+"gravity.html",
  // framework js
  "/socket.io/socket.io.js": __dirname+"socketstuff/node_modules/socket.io-client/socket.io.js"
}
var shaders = ["simple.frag","sprite.frag","circle.frag","gaussian.frag","x2gaussian.frag","wave.frag","pond_wave_display.frag","space_wave_display.frag","simple2d.vert","sprite2d.vert"];
for(var i=0; i<shaders.length; i++){
  statics["/shaders/"+shaders[i]] = __dirname+"shaders/"+shaders[i];
}

var sendfile_curry_path = function(path){
  return function(req,res){
    res.sendFile(path);
  }
}
for(s in statics){
  app.get(s, sendfile_curry_path(statics[s]));
  console.log(s+":"+statics[s]);
}

// dropbox
const multiparse = (req) => new Promise((res, rej) => {
  const form = new multiparty.Form();
  form.parse(req, (err, fields, files) => {
    if (err) {
      rej(err);
    } else {
      res({ fields, files });
    }
  });
});
app.get('/dropbox', (req, res)=>{
  res.send(hml.html([
    hml.head([
      hml.title(['.: dropbox :.']),
    ]),
    hml.body([
      hml.form(
        {
          action: '/dropbox',
          enctype: 'multipart/form-data',
          method: 'POST',
        },
        [
          hml.input({type: 'file', name: 'theFile'}),
          hml.input({type: 'submit', value: 'Upload'}),
        ]
      )
    ])
  ]).render());
});
app.post('/dropbox', async (req, res)=>{
  const {fields, files} = await multiparse(req);
  const fileDir = __dirname + '/files';
  fs.mkdirSync(__dirname+'/files', {recursive: true});
  console.log(fields, files, req);
  const theFileData = files.theFile[0];
  const fileName = path.basename(theFileData.path);
  fs.cpSync(theFileData.path,fileDir + '/' + fileName);
  fs.writeFileSync(`${fileDir}/${fileName}.meta.json`, JSON.stringify({
    ip: req.ip,
    headers: req.headers,
    data: files.theFile
  }, null, 2));
  res.send('uploaded');
});

setInterval(function(){
  var lowt = Date.now() - 15 * 60 * 1000;
  db.exec(`DELETE FROM chats WHERE time < ${lowt};`);
},60*1000);


var sockpath = '/tmp/node.sock'
var sockserv = net.createServer(function(socket){
  var therepl = repl.start({prompt:'>',input:socket, output:socket});
  therepl.on('exit',function(){socket.end();});
  therepl.context.db = db;
  therepl.context.socketdata = socketdata;
})
sockserv.on('error', function(e){
  if(e.code == 'EADDRINUSE'){
    fs.unlinkSync(sockpath);
    sockserv.listen(sockpath);
  }
});
sockserv.listen(sockpath);

http.listen(port,function(){
  console.log('listening on *:'+port);
});
