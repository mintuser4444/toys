var keys = {'h':"left",
	    'n':"right",
	    't':"down",
	    ' ':"drop",
	    'e':"counterclockwise",
	    'u':"retrograde"};

var points = {"place": 5,
	      "drop": 2,
	      "down": 1,
	      "line": 50,
	      "double": 150,
	      "triple": 300,
	      "tetris": 500};

var shape_names = ["I","O","S","Z","T","L","J"];
var shapes = [[2,1,2,2,2,3,2,0, 1,1,2,1,3,1,0,1, 1,1,1,2,1,3,1,0, 1,2,2,2,3,2,0,2],
	      [1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1],
	      [1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1, 1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1],
	      [2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1, 2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1],
	      [0,1,1,1,2,1,1,2, 1,0,1,1,2,1,1,2, 1,0,0,1,1,1,2,1, 1,0,0,1,1,1,1,2],
	      [0,1,1,1,2,1,0,2, 1,0,1,1,1,2,2,2, 2,0,0,1,1,1,2,1, 0,0,1,0,1,1,1,2],
	      [0,0,0,1,1,1,2,1, 1,0,1,1,0,2,1,2, 0,1,1,1,2,1,2,2, 1,0,2,0,1,1,1,2]];
var attrs = ["paused", "done", "ticklen", "score", "lines", "singles", "doubles", "triples", "tetrises", "drops", "I", "O", "S", "Z", "T", "L", "J"];

var Tetris = function(){
    // start with methods, end with variable declarations and setup code.  lol.

    this.attrup = function(attr, up){
	if(up == null){
	    this[attr]++;
	} else {
	    this[attr] += up;
	}
	this.draw_attr(attr);
    }

    this.next = function(){
	this.x = 4;
	this.y = 0;
	this.shape = this.nextshape;
	this.rot = this.nextrot;
	this.attrup(shape_names[this.shape]);
	this.nextshape = Math.floor(Math.random()*7);
	this.nextrot = Math.floor(Math.random()*4);
	var lines = 0;
	var rows = this.board.childNodes;
	for(var j=0;j<rows.length-1;j++){
	    var cels = rows[j].childNodes;
	    var isaline = true;
	    for(var i=1;i<cels.length-1;i++){
		if(cels[i].className == "empty"){
		    isaline = false;
		    break;
		}
	    }
	    if(isaline){
		this.board.removeChild(rows[j]);
		this.board.insertBefore(this.new_row(),this.board.firstChild);
		this.attrup("lines");
		lines++;
	    }
	}
	if(lines == 1){
            this.attrup("score", points["line"]);
            this.attrup("singles");
	} else if(lines == 2){
            this.attrup("score", points["double"])
            this.attrup("doubles")
	    //            this.displayframe.pushlines(1)
	} else if(lines == 3){
            this.attrup("score", points["triple"]);
            this.attrup("triples");
	    //    this.displayframe.pushlines(2)
	
	} else if(lines == 4){
            this.attrup("score", points["tetris"]);
            this.attrup("tetrises");
	    //            this.displayframe.pushlines(4)
	}
	this.updateticklen();
	if(this.bump()){
	    this.done = true;
	    this.draw_attr("done");
	    // this.displayframe.transfer("attrs")
	}
	this.plotshape();
	this.plotnext();
    }

    this.putlines = function(lines){
	this.board_mutex.lock(do_putlines,lines);
    }

    this.do_putlines = function(lines){
	this.plotshape("empty");
	var rows = new Array();
	for(var i=0;i<lines;i++){
	    // implement this later
	}
	this.plotshape();
	this.board_mutex.unlock();
    }

    this.plotshape = function(state){
	if(state == null){
	    state = shape_names[this.shape]+" falling";
	}
	var rows = this.board.childNodes;
	var s = shapes[this.shape];
	for(var i=0;i<8;i+=2){
	    rows[this.y+s[this.rot*8+i+1]].childNodes[this.x+s[this.rot*8+i]].className = state;
	}
    }

    this.plotnext = function(){
	var rows = this.nextarea.childNodes;
	for(var j=0;j<4;j++){
	    for(var i=0;i<4;i++){
		rows[i].childNodes[j].className = "empty next";
	    }
	}
	var s = shapes[this.nextshape];
	var state = shape_names[this.nextshape]+" next";
	for(var i=0;i<8;i+=2){
	    rows[s[this.nextrot*8+i+1]].childNodes[s[this.nextrot*8+i]].className = state;
	}
    }

    this.bump = function(){
	var rows = this.board.childNodes;
	var s = shapes[this.shape];
	for(var i=0;i<8;i+=2){
	    var clsid = rows[this.y+s[this.rot*8+i+1]].childNodes[this.x+s[this.rot*8+i]].className;
	    if(clsid=="wall" || clsid.slice(2,6)=="down"){
		return true;
	    }
	}
	return false;
    }

    this.stick = function(){
	this.y--;
	this.plotshape(shape_names[this.shape]+" down");
	this.attrup("score", points["place"]);
	this.next();
    }

    this.commit = function(y,x,r){
	if(x){
	    this.x -= x;
	    this.plotshape("empty");
	    this.x += x;
	    this.plotshape();
	} else if(y){
	    this.y -= y;
	    this.plotshape("empty");
	    this.y += y;
	    this.plotshape();
	} else if(r){
	    this.rot = (this.rot-r+4)%4;
	    this.plotshape("empty");
	    this.rot = (this.rot+r)%4;
	    this.plotshape();
	}
    }

    this.new_row = function(){
	var row = document.createElement("tr");
	var wall = document.createElement("td");
	wall.className = "wall";
	row.appendChild(wall);
	for(var i=0;i<this.width-2;i++){
	    var empty = document.createElement("td");
	    empty.className = "empty";
	    row.appendChild(empty);
	}
	var wall = document.createElement("td");
	wall.className = "wall";
	row.appendChild(wall);
	return row;
    }

    this.draw_attr = function(attr){
	var atamant = document.getElementById(attr);
	if(atamant){
	    atamant.textContent = this[attr];
	}
    }

    this.execute = function(command){
	this.board_mutex.lock(do_execute, command);
    }

    this.do_execute = function(command){
	try{
	    if(this.paused){
		this.unpause();
	    }
	    if(command=="left"){
		this.x--;
		if(this.bump()){
		    this.x++; 
		} else {
		    this.commit(0,-1);
		}
		this.y++;
		if(this.bump()){
		    this.ignore_next_tick = true;
		}
		this.y--;
	    } else if(command=="right"){
		this.x++;
		if(this.bump()){
		    this.x--; 
		} else {
		    this.commit(0,1);
		}
		this.y++;
		if(this.bump()){
		    this.ignore_next_tick = true;
		}
		this.y--;
	    } else if(command=="down"){
		// you are not allowed to stick a piece with the down key.
		// it is for your own protection comrade.
		this.y++;
		var did = true;
		if(this.bump()){
		    this.y--;
		    did = false;
		}
		if(did){
		    this.attrup("score", points["down"]);
		    this.commit(1,0);
		}
	    } else if(command == "drop"){
		this.plotshape("empty");
		while(!this.bump()){
		    this.y++;
		    this.attrup("score", points["drop"]);
		}
		this.attrup("drops");
		this.attrup("score", -points["drop"]);
		this.stick();
		return;
	    } else if(command == "counterclockwise"){
		this.rot = (this.rot+1)%4;
		if(this.bump()){
		    this.rot = (this.rot+3)%4;
		} else {
		    this.commit(0,0,1);
		}
		this.y++;
		if(this.bump()){
		    this.ignore_next_tick = true;
		}
		this.y--;
	    } else if(command == "retrograde"){
		this.rot = (this.rot+3)%4;
		if(this.bump()){
		    this.rot = (this.rot+1)%4;
		} else {
		    this.commit(0,0,3);
		}
		this.y++;
		if(this.bump()){
		    this.ignore_next_tick = true;
		}
		this.y--;
	    } else if(command == "pause"){
		this.pause();
	    } else if(command == "reset"){
		reset();
	    }
	} finally {
	    this.board_mutex.unlock();
	}		    
    }

    this.handlekeypress = function(e){
	if(e.charCode){
	    var key = String.fromCharCode(e.charCode);
	} else {
	    var key = e.keyCode;
	}
	var command = keys[key];
	if(command){
	    this.execute(command);
	    e.stopPropagation();
	}
    }

    this.updateticklen = function(){
	var coefficient = this[player["accel"]];
	this.ticklen = Math.ceil(player["basedroptime"]/(coefficient*player["accelfactor"]+1));
    }

    this.unpause = function(){
	this.paused = false;
	this.setup_tick();
	this.draw_attr("paused");
    }

    this.pause = function(tetris){
	this.paused = true;
	this.draw_attr("paused");
    }

    this.setup_tick = function(){
	var next_tick = new Date().getTime();
	this.next_tick = next_tick;
	setTimeout(function(){tick(next_tick);},this.ticklen);
    }

    this.tick = function(securekey){
	if(this.paused || this.done){
	    return;
	}
	if(securekey != this.next_tick){
	    return;
	}
	try{
	    if(this.ignore_next_tick){
		this.ignore_next_tick = false;
		return;
	    }
	    this.board_mutex.lock(do_tick, "lol");
	} finally {
	    this.setup_tick();
	}
    }
    
    this.do_tick = function(){
	try{
	    this.y++;
	    if(this.bump()){
		this.stick();
		return;
	    } else {
		this.commit(1,0);
	    }
	} finally {
	    this.board_mutex.unlock();
	}
    }

    this.transfer = function(command, lines){
	if(!multiplaying){
	    return
	}
	var data;
	switch(command){
	    case "board":
		data = this.board.innerHTML;
		break;
            case "attrs":
		data = ""
		for(i=0;i<attrs.length;i++){
		    data += attrs[i] + ": " + this[attrs[i]] + "\n";
		}
		break;
            case "next":
		data = this.nextshape + "\n" + this.nextrot;
		break;
            case "lines":
		data = lines;
		break;
	    case "pause":
	        data = "(empty)";
		break;
	    case "unpause":
	        data = "(empty)";
		break;
	    case "reset":
	        data = "(empty)";
		break;
	}
	send(this.player.name, command, data);
    }



    //ok, time to start things
    this.width = player["width"]+2;
    this.height = player["height"]+1;
    this.board = document.createElement("table");
    this.board.className = "board";
    for(var i=0;i<this.height;i++){
	this.board.appendChild(this.new_row());
    }
    for(var i=1;i<this.width-1;i++){
	this.board.lastChild.childNodes[i].className = "wall";
    }
    this.nextarea = document.createElement("table");
    this.nextarea.className = "board next";
    for(var j=0;j<4;j++){
	var row = document.createElement("tr");
	for(var i=0;i<4;i++){
	    row.appendChild(document.createElement("td"));
	}
	this.nextarea.appendChild(row);
    }
    this.board_mutex = new mutex();
    this.ignore_next_tick = false;
    this.next_tick = 0;
    this.nextshape = Math.floor(Math.random()*7);
    this.nextrot = Math.floor(Math.random()*4);
    for(var i=0;i<attrs.length;i++){
	this[attrs[i]] = 0;
    }
    this.done = false;
    this.paused = true;
    var attrtable = document.createElement("table");
    var attrdiv = document.getElementById("attrs");
    attrtable.id = "attrtable";
    for(i=0;i<attrs.length;i++){
	var row = document.createElement("tr");
	var name = document.createElement("td");
	name.textContent = attrs[i];
	name.className = "attrname";
	row.appendChild(name);
	var value = document.createElement("td");
	value.id = attrs[i];
	value.className = "attr";
	row.appendChild(value);
	attrtable.appendChild(row);
    }
    attrdiv.appendChild(attrtable);
    for(i=0;i<attrs.length;i++){
	this.draw_attr(attrs[i]);
    }
    this.none = 0;
    this.updateticklen();
    this.next();
    document.getElementById("board").appendChild(this.board);
    document.getElementById("next").appendChild(this.nextarea);
    this.board.tabIndex = 1;
    this.board.focus();
    this.board.addEventListener("keypress", tetris_handlekeypress, true);
    this.board.addEventListener("blur", tetris_pause, false);
}
    
var tetris_handlekeypress = function(){
    return tetris.handlekeypress.apply(tetris, arguments);
}

var tetris_pause = function(){
    return tetris.pause.apply(tetris, arguments);
}

var tick = function(){
    return tetris.tick.apply(tetris, arguments);
}

var do_tick = function(){
    return tetris.do_tick.apply(tetris, arguments);
}

var do_execute = function(){
    return tetris.do_execute.apply(tetris, arguments);
}

var do_putlines = function(){
    return tetris.do_putlines.apply(tetris, arguments);
}

var reset = function(){
    tetris.done = true;
    document.getElementById("board").removeChild(tetris.board);
    document.getElementById("next").removeChild(tetris.nextarea);
    var attrtable = document.getElementById("attrtable");
    while(attrtable.firstChild){
	attrtable.removeChild(attrtable.firstChild);
    }
    tetris = new Tetris();
}

var mutex = function(){ // mutex for tetris.  and only for tetris.  lol.
    this.locked = false;
    this.queue = new Array();
    this.lock = function(func, arg){
	if(!this.locked){
	    this.locked = true;
	    func(arg);
	} else {
	    this.queue.push(arguments);
	}
    }
    this.unlock = function(){
	if(this.queue.length > 0){
	    var stuff = this.queue.shift();
	    stuff[0](stuff[1]);
	} else {
	    this.locked = false;
	}
    }
}
    
    
var keyslist = ["left", "right", "down", "drop", "counterclockwise", "retrograde", "pause", "reset"];
var numericprefs = ["width","height","basedroptime","accelfactor"];
var allprefs = ["left", "right", "down", "drop", "counterclockwise", "retrograde", "pause", "reset", "width", "height", "basedroptime", "accelfactor", "accel"];


var getpreftable = function(){
    for(var i=0;i<keyslist.length;i++){
	var keyinput = document.getElementById(keyslist[i]);
	keyinput.addEventListener("keypress", setkey, true);
    }
    for(var i=0;i<numericprefs.length;i++){
	var numinput = document.getElementById(numericprefs[i]);
	numinput.addEventListener("focusout", setnumeric, false);
    }
    var accelinput = document.getElementById("accel");
    accelinput.addEventListener("focusout", setaccel, false);
//    var nameinput = document.getElementById("name");
//    nameinput.addEventListener("focusout", setname, false);
}

var setkey = function(e){
    if(e.charCode){
	var key = String.fromCharCode(e.charCode);
    } else {
	var key = e.keyCode;
    }
    keys[key] = this.id;
    this.value = key;
    document.cookie = "tetris_"+this.id+"="+key;
    e.preventDefault();
}

var initkey = function(key){ // !! this swaps the key with the value
    var keyel = document.getElementById(key);
    if(keys[key] != null){
	keyel.value = keys[key];
    } else {  
	if(keyel.value.length>1){ // then its a keyCode
	    keys[key] = Number(keyel.value);
	} else {
	    keys[key] = keyel.value;
	}
    }
    keys[keys[key]] = key;
}

var setnumeric = function(e){
    var n = Number(this.value);
    var invalid = function(){
	this.value = player[this.id];
    }	
    if(n == NaN){ //reject bad numbers
	invalid();
	return;
    }
    switch(this.id){
        case "width":
        case "height":
            n = Math.round(n);
	    if(n<4){
		invalid();
		return;
	    }
	    break;
        case "basedroptime":
            n = Math.round(n);
        case "accelfactor":
	    if(n<1){
		invalid();
		return;
	    }
    }
    player[this.id] = n;
    document.cookie = "tetris_"+this.id+"="+n;
}

var initnumeric = function(key){
    var keyel = document.getElementById(key);
    var invalid = function(){player[key] = Number(keyel.value);}
    if(player[key] == NaN || player[key] == null){
	invalid();
	return;
    }
    switch(key){
        case "width":
        case "height":
	    player[key] = Math.round(player[key]);
	    if(player[key] < 4){
	        invalid();
	        return;
	    }
	    break;
        case "basedroptime":
            player[key] = Math.round(player[key]);
        case "accelfactor":
	    if(player[key]<1){
		invalid();
		return;
	    }
    }
    keyel.value = player[key];
}

var setaccel = function(e){
    player["accelfactor"] =  this.value;
    document.cookie = "tetris_accel="+this.value;
}

//var setname = function(e){
//    player["name"] = this.value;
//    document.cookie = "tetris_name="+this.value;
//}
	

var getprefs = function(){
    var fragments = document.cookie.split(';');
    var settings = Array();
    for(var i=0;i<fragments.length;i++){
	var shards = fragments[i].split('=');
	if(shards[0].slice(0,6)=="tetris"){
	    var key = shards[0].slice(7,shards[0].length);
	    var value = shards[1];
	    switch(shards[0].slice(7,0)){
	        case "left":
	        case "right":
	        case "down":
	        case "drop":
	        case "counterclockwise":
	        case "retrograde":
	        case "pause":
	        case "reset":
		    if(value.length>1){ // then its a keyCode
			settings[key] = Number(value);
		    } else {
			settings[key] = value;
		    }
		    break;
	        case "width":
	        case "height":
	        case "basedroptime":
	        case "accelfactor":
		    settings[key] = Number(value);
		    break;
	        case "name":
		    settings[key] = value;
		    break;
	        case "accel":
		    settings[key] = value;
		    break;
	    }
	}
    }
    for(var i=0; i<keyslist.length; i++){
	if(settings[keyslist[i]]){
	    keys[keyslist[i]] = settings[keyslist[i]];
	}
	initkey(keyslist[i]);
    }
    for(var i=0; i<numericprefs.length; i++){
	if(settings[numericprefs[i]]){
	    player[numericprefs[i]] = settings[numericprefs[i]];
	}
	initnumeric(numericprefs[i]);
    }
    if(settings["accel"]){
	player["accel"] = settings["accel"];
	switch(player["accel"]){
	    case "drops":
	    case "lines":
	    case "score":
	    case "none":
		document.getElementById("accel").value = player["accel"];
	    default:
		player["accel"] = document.getElementById("accel").value;
	}
    } else {
	player["accel"] = document.getElementById("accel").value;
    }    
//    if(settings["name"]){
//	player["name"] = settings["name"];
//	document.getElementById("name").value = player["name"];
//    } else {
//	player["name"] = document.getElementById("name").value;
//    }
}

window.on_javasock_headers = function(data){
    //actually, this is irrelevant
}

window.on_javasock_get_headers = function(){
    headers = "name:"+tetris.player.name+"\n";
    headers += "width:"+tetris.player.width+"\n";
    headers += "height:"+tetris.player.height+"\n";
    headers += "xmlboard:True\n\n";
    return headers;
}

var parser = new DOMParser();
window.on_javasock_packet = function(name, command, data){
    switch(command){
        case "board":
	    var doc = parser.parseFromString(data, "text/xml");
 	    multiboard = document.getElementById("multiboard");
	    while(multiboard.firstChild){
		multiboard.removeChild(multiboard.firstChild);
	    }
	//	multiboard.appendChild(
    }
}	    


window.on_javasock_ready = function(){
    send = document.getElementById("javasock").send;
    multiplaying = true;
}

var load_javasock = function(e){
    e.preventDefault();
    var multidiv = document.getElementById("multiplayer");
    var ot = document.createElement("object");
    ot.id = "javasock";
    ot.classid = "java:javasock.class";
    ot.type = "application/x-java-applet";
    ot.height = 20;
    ot.width = 50;
    multidiv.appendChild(ot);

}    

var prepmultiplayer = function(){
//    loadbutton = document.getElementById("appletload");
//    loadbutton.addEventListener("click", load_javasock, true);
}

var send;
var multiplaying = false;
var javasock;
var tetris; 
var player;
var keys;
window.onload = function(){
    player = {};
    keys = {};
    getprefs();
    getpreftable();
    prepmultiplayer();
    tetris = new Tetris();
}
