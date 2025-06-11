// Express, MongoDB, socket.io
var app = require('express')();
app.disable('x-powered-by'); // to prevent attacks targeted at the framework
var http = require('http');
var https = require('https');
const multiparty = require('multiparty');
const { ExpressPeerServer } = require('peer');
var io = require('socket.io')();
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
var assert = require('assert');

const hml = require('./hml');

// used to attach the debugger
var net = require('net');
var repl = require('repl');
var fs = require('fs');
var path = require('path');

var httpPort = 80;
var httpsPort = 443;

__dirname = process.cwd()+"/";
const toysDir = process.cwd().split('/').slice(0,-1).join('/') + '/';

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

const printSocketData = socketData => {
  const socketDataCopy = {...socketData};
  delete socketDataCopy.socket;
  return socketDataCopy;
}

const allSocketData = [];
io.on('connection', function(socket){
  console.log('socket connection:' + socket);
  const mySocketData = {
    socket,
    nick: '',
    room: '',
    peerJsId: undefined,
    hosting: []
  };
  allSocketData.push(mySocketData);  

  socket.on('room subscribe', async function(msg){
    console.log('socket', 'room subscribe', msg, printSocketData(mySocketData));
    mySocketData.room = msg.room;
    const myChats = await db.all('SELECT * FROM chats WHERE room=?;',msg.room);
    myChats.forEach(doc => {
      console.log('sending old chats: ' + doc.msg);
      socket.emit('chat message', {
        msg:  doc.msg,
        nick: doc.nick,
        time: doc.time
      });
    });
  });

  socket.on('nick', function(msg){
    var oldnick = mySocketData.nick;
    mySocketData.nick = msg.nick;
    if(mySocketData.room != '' && oldnick != ''){
      roommsg({
        room: mySocketData.room,
        nick: oldnick,
        msg: "nick change to " + msg.nick,
        time: Date.now()
      });
    };
    console.log('nick change: ' + oldnick + ' →  ' + msg.nick);
  });

  socket.on('peerJsId', msg => {
    mySocketData.peerJsId = msg.peerJsId;
  });

  socket.on('disconnect', function(){
    var nick = mySocketData.nick;
    var room = mySocketData.room;
    if(nick == '')
      nick = 'someone';
    if(room == '')
      room = 'nowhere';
    var time = Date.now();
    var i = allSocketData.indexOf(mySocketData);
    allSocketData.splice(i,1);
    roommsg({room: room, nick: nick, msg: "disconnected", time: time});
    console.log(nick + ' disconnected from ' + room + " at " + time);
  });

  socket.on('chat message', async function(msg){
    const smsg = {
      msg: msg.msg,
      nick: mySocketData.nick,
      room: mySocketData.room,
      time: Date.now()
    };
    await db.run('INSERT INTO chats VALUES (?,?,?,?);',[smsg.msg,smsg.nick,smsg.room,smsg.time]);
    roommsg(smsg);
    console.log('chat message: ['+smsg.room+']['+smsg.time+']['+smsg.nick+']: '+smsg.msg);
  });

  const getHostSocketData = room => {
    const hostSocketData = allSocketData.filter(
      socketData=>socketData.hosting.includes(room)
    )[0];
    return hostSocketData;
  };

  socket.on('get host', async function(msg){
    console.log('socket', 'get host', msg, printSocketData(mySocketData));
    const room = msg.room;
    const hostSocketData = getHostSocketData(room);
    socket.emit('host', {
      host: hostSocketData?.peerJsId,
      room
    });
  });

  socket.on('become host', async function(msg){
    console.log('socket', 'become host', msg, printSocketData(mySocketData));
    const room = msg.room;
    const hostSocketData = getHostSocketData(room);
    if(!hostSocketData){
      mySocketData.hosting.push(room);
    }
    allSocketData.filter(
      socketData => socketData.room == room
    ).forEach(socketData => socketData.socket.emit('host', {
      host: mySocketData.peerJsId,
      room
    }));
  });

  socket.emit('connected', '');
});

var roommsg = function(msg){
  for(var i=0; i<allSocketData.length; i++){
    if(allSocketData[i].room == msg.room)
      allSocketData[i].socket.emit('chat message', msg);
  }
}

statics = {
  "/": toysDir+"socketstuff/index.html",
  "/peer.html": toysDir+"socketstuff/peer.html",
  "/turtlepond.js": toysDir+"turtlepond/turtlepond.js",
  "/turtle.png": toysDir+"turtlepond/turtle.png",
  "/fish.png": toysDir+"turtlepond/fish.png",
  "/turtlepond/turtle512.png": toysDir+"turtlepond/turtle512.png",
  "/turtlepond/fish128.png": toysDir+"turtlepond/fish128.png",
  "/domtetris.html": toysDir+"domtetris/domtetris.xhtml",
  "/tetris.css": toysDir+"domtetris/tetris.css",
  "/tetris.js": toysDir+"domtetris/tetris.js",
  "/chatclient.js": toysDir+"socketstuff/chatclient.js",
  "/fractal.html": toysDir+"fractal.html",
  "/fractal-webgl.html": toysDir+"fractal-webgl.html",
  "/fragment.html": toysDir+"fragment.html",
  "/gravity.html": toysDir+"gravity.html",
}
var shaders = ["simple.frag","sprite.frag","circle.frag","gaussian.frag","x2gaussian.frag","wave.frag","pond_wave_display.frag","space_wave_display.frag","simple2d.vert","sprite2d.vert"];
for(var i=0; i<shaders.length; i++){
  statics["/shaders/"+shaders[i]] = toysDir+"shaders/"+shaders[i];
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

app.get('/spotcam/:pup', sendfile_curry_path(statics['/peer.html']));

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
  therepl.context.socketdata = allSocketData;
})
sockserv.on('error', function(e){
  if(e.code == 'EADDRINUSE'){
    fs.unlinkSync(sockpath);
    sockserv.listen(sockpath);
  }
});
sockserv.listen(sockpath);

const servers = [[http.Server(app), httpPort]];
if(!process.env.NO_HTTPS){
  const le = '/etc/letsencrypt/live/tomdonahue.net/';
  const creds = {
      key: 'privkey.pem',
      cert: 'cert.pem',
      ca: 'chain.pem'
  };
  for(const key in creds){
    creds[key] = fs.readFileSync(le+creds[key]);
  }
  const httpsServer = https.createServer(creds, app);
  servers.push([httpsServer, httpsPort]);
}

servers.forEach(([server, port]) => {
  io.attach(server);
  const peerServer = new ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs',
  });
  app.use('/peerjs', peerServer);
  server.listen(port, () => {
    console.log('listening on port', port)
  })
});
