/* globals screen:true */
var screenwidth = 500;
var screenheight = 500;
var sandradius = 20
var tickmillis = 50;
var turtlespeed = screenwidth / 10000 * tickmillis;
var turtlecount = 5;
var turtleradius = 20;
var mousex = 0;
var mousey = 0;
var mousearear2 = (screenwidth / 4) * (screenwidth / 4);
var turtlecolor = [0,200/256,64/256,1];
var turtledipcolor = [64/256,128/256,64/256,1];
var foodcolor = [0,0,0,1];
var foodradius = 2;
var foodspeed = turtlespeed / 10;
var eggcolor = [128/256,128/256,64/256,1];
var egghatchticks = 5000 / tickmillis;
var eggradius = 10;
var pregticks = 500 / tickmillis;
var fish_spritephase_tick = 223 / tickmillis;
var turtlestroketicks = 200 / tickmillis;
var fishradius = 15;
var fishcount = 4;
var fish_surface_ticks = 3000 / tickmillis;
var fish_under_ticks = 10000 / tickmillis;
var fish_submerge_color = [0,32/256,64/256,1];
var fish_surface_color = [0,64/256,128/256,1];
var sandcolor = [200/256,150/256,0,1];
var watercolor = [0,64/256,255/256,1];


var turtles = [];
var foods = [];
var eggs = [];
var fishs = [];
var canvas;
var gl;

var shader_requests_manager = {
  _outstanding: 0,
  no_outstanding_shaders: function(){}
};
Object.defineProperty(shader_requests_manager, "outstanding", {
  get: function(){return this._outstanding;},
  set: function(x){
    this._outstanding = x;
    if(x==0){
      this.no_outstanding_shaders();
    }
    return x;
  }
});
var ajax_load_shader = function(o,type,url){
  var r = new XMLHttpRequest();
  r.open("get",url);
  r.addEventListener('load',function(){
    o[type] = this.responseText;
    shader_requests_manager.outstanding--;
  });
  shader_requests_manager.outstanding++;
  r.send();
}
var load_shader_source = function(furl,vurl){
  var o = {};
  ajax_load_shader(o,"frag",furl);
  ajax_load_shader(o,"vert",vurl);
  return o;
}
var load_shader_program = function(vss,fss){
  var vshader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vshader, vss);
  gl.compileShader(vshader);
  if(!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)){
    console.log("Error in " + vss);
    console.log(gl.getShaderInfoLog(vshader));
  }
  var fshader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fshader, fss);
  gl.compileShader(fshader);
  if(!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)){
  	console.log("Error in " + fss);
    console.log(gl.getShaderInfoLog(fshader));
  }
  var program = gl.createProgram();
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.log(gl.getProgramInfoLog(program));
  var programdata = {program:program};
  var n = gl.getProgramParameter(program,gl.ACTIVE_ATTRIBUTES);
  for(var i=0; i<n; i++){
    var name = gl.getActiveAttrib(program,i).name;
    programdata[name] = gl.getAttribLocation(program,name);
  }
  n = gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);
  for(var i=0; i<n; i++){
    var name = gl.getActiveUniform(program,i).name;
    programdata[name] = gl.getUniformLocation(program,name);
  }
  return programdata;
}

var sprogram = {};
sprogram["simple"] = load_shader_source("/shaders/simple2d.vert","/shaders/simple.frag");
sprogram["sprite"] = load_shader_source("/shaders/sprite2d.vert","/shaders/sprite.frag");
sprogram["ellipse"] = load_shader_source("/shaders/sprite2d.vert","/shaders/circle.frag");
sprogram["waveic"] = load_shader_source("/shaders/sprite2d.vert","/shaders/x2gaussian.frag");
sprogram["wave_sim"] = load_shader_source("/shaders/sprite2d.vert","/shaders/wave.frag");
sprogram["wave_display"] = load_shader_source("/shaders/sprite2d.vert","/shaders/pond_wave_display.frag");

sprites = {turtle: {src: "/turtlepond/turtle512.png"},
           fish: {src: "/turtlepond/fish128.png", horizontal: 7}};
var getsprites = function(){
  for(sprite in sprites){
  	var img = new Image();
  	img.src = sprites[sprite].src;
  	sprites[sprite].img = img;
  	img.onload = function(s,i){return function(){maketextures(s,i)};}(sprite,img);
  }
}
totex = new Array();
var offscreen_canvas;
var maketextures = function(sprite,img){
  //console.log(sprite,img,img.width);
  if(!gl){
    totex.push([sprite,img]);
    return;
  }
  sprites[sprite].tex = new Array();
  var h = sprites[sprite].horizontal?sprites[sprite].horizontal:1;
  var v = sprites[sprite].vertical?sprites[sprite].vertical:1;
  var sz = sprites[sprite].img.width/h;
  offscreen_canvas.width = sz;
  offscreen_canvas.height = sz;
  var ctx = offscreen_canvas.getContext("2d");
  for(var i=0; i<h; i++){
  	for(var j=0; j<v; j++){
      sprites[sprite].tex[i*v+j] = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, sprites[sprite].tex[i*v+j]);
      ctx.clearRect(0,0,sz,sz);
      ctx.drawImage(img,i*sz,j*sz,sz,sz,0,0,sz,sz);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,offscreen_canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
  	}
  }
}
getsprites();


var shapes = {};

startturtlepond = function(width, height, tag){
  console.log("outstanding shader requests: " + shader_requests_manager.outstanding);
  if(shader_requests_manager.outstanding != 0){
    console.log("outstanding shader requests, deferring program start");
    shader_requests_manager.no_outstanding_shaders = function(){startturtlepond(width,height,tag);};
    return;
  }
  console.log("starting program");
  if(width)
    screenwidth = width;
  if(height)
    screenheight = height;
  if(tag)
    makecanvas(tag);
  else
    makecanvas();
  maketurtles();
  makefish();

  canvas.addEventListener("mousemove", storemousepos);
  canvas.addEventListener("click", addfood, false);
  canvas.addEventListener("touchend", addfood, false);
  setup_drawing();
  mainloop();
};

var makecanvas = function(scrin){
  if(!scrin) {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
  } else {
    canvas = scrin;
  }
  canvas.width = screenwidth;
  canvas.height = screenheight;
};

var storemousepos = function(e){
  var r = canvas.getBoundingClientRect();
  mousex = e.clientX - r.left;
  mousey = e.clientY - r.top;
};

var addfood = function(e){
  var r = canvas.getBoundingClientRect();
  mousex = e.clientX - r.left;
  mousey = e.clientY - r.top;
  var foodi = {
    x: screenwidth-mousex,
    y: mousey,
    xdot: 0,
    ydot: 0,
    r: foodradius,
    r2: foodradius * foodradius,
    walldist: sandradius,
    color: foodcolor
  };
  foods.push(foodi);
  make_wave(foodi.x,foodi.y,4*foodi.r,2);
};

var maketurtles = function(){
  for(var i = 0; i < turtlecount; i++)
    maketurtle();
};

var makefish = function(){
  for(var i=0; i < fishcount; i++){
    var direction = Math.random()*2*Math.PI;
    var fishi = {
      x: sandradius + fishradius + Math.random()*(screenwidth-2*sandradius-2*fishradius),
      y: sandradius + fishradius + Math.random()*(screenheight-2*sandradius-2*fishradius),
      r: fishradius,
      r2:fishradius * fishradius,
      direction: direction,
      xdot: Math.cos(direction)*turtlespeed,
      ydot: Math.sin(direction)*turtlespeed,
      bump_policy: "bounce",
      walldist: sandradius,
      transition_ticks: Math.random()*fish_under_ticks,
      surfaced: false,
      color: fish_submerge_color,
      spritephase: Math.random()*2*Math.PI
    }
    fishs.push(fishi);
  }
}

var turtlesexcalculator = function(){
  var hasmale = false;
  var hasfemale = false;
  for(var i=0; i<turtles.length; i++){
    if(turtles[i].sex == 'female')
      hasfemale = true;
    if(turtles[i].sex == 'male')
      hasmale = true;
  }
  if(!hasfemale)
    return 'female';
  if(!hasmale)
    return 'male';
  return Math.random() < .5 ? 'female' : 'male';
}

var maketurtle = function(x, y){
  if(typeof x === 'undefined')
    x = turtleradius + Math.random() * (screenwidth - 2 * turtleradius);
  if(typeof y === 'undefined')
    y = turtleradius + Math.random() * (screenwidth - 2 * turtleradius);
  var direction = Math.random() * Math.PI * 2;
  var turtlei = {
    x: x,
    y: y,
    direction: direction,
    xdot: Math.cos(direction) * turtlespeed,
    ydot: Math.sin(direction) * turtlespeed,
    r: turtleradius,
    r2: turtleradius * turtleradius,
    bump_policy: "bounce",
    walldist: 0,
    intended_direction: 'undefined',
    color: turtlecolor,
    energy: 1,
    sex: turtlesexcalculator(),
    pregticks: 0,
    pregnant: false,
    legs: [{attachx: 1/2*turtleradius,
            attachy: 1/6*turtleradius,
            leglen:  2/3*turtleradius,
            sorientation: 0,
            strokephase: Math.random()*2*Math.PI,
            color: turtlecolor},
           {attachx: -1/2*turtleradius,
            attachy: 1/6*turtleradius,
            leglen:  2/3*turtleradius,
            sorientation: Math.PI,
            strokephase: Math.random()*2*Math.PI,
            color: turtlecolor},
           {attachx: -1/2*turtleradius,
            attachy: -5/6*turtleradius,
            leglen:  2/3*turtleradius,
            sorientation: Math.PI,
            strokephase: Math.random()*2*Math.PI,
            color: turtlecolor},
           {attachx: 1/2*turtleradius,
            attachy: -5/6*turtleradius,
            leglen:  2/3*turtleradius,
            sorientation: 0,
            strokephase: Math.random()*2*Math.PI,
            color: turtlecolor}]
  };
  turtles.push(turtlei);
};

var maybemate = function(t1, t2){
  if(t1.sex == "male" && t2.sex == "female")
    t1, t2 = t2, t1;
  if(t1.sex != "female")
    return;
  if(t2.sex != "male")
    return;
  if(t1.energy < 3)
    return;
  if(t2.energy < 2)
    return;
  if(t1.pregnant > 0)
    return;
  t1.energy -= 2;
  t2.energy -= 1;
  t1.pregnant = true;
  t1.pregticks = pregticks;
}

var makeegg = function(x, y){
  var closewall = closest_wall(x,y);
  if(closewall == 0)
    x = screenwidth - sandradius;
  if(closewall == 1)
    y = sandradius;
  if(closewall == 2)
    x = sandradius;
  if(closewall == 3)
    y = screenheight - sandradius;
  var eggi = {
    x: x,
    y: y,
    hatchticks: egghatchticks,
    r: eggradius,
    color: eggcolor
  }
  eggs.push(eggi);
}

var fishsurface = function(fish){
  fish.surfaced = true;
  fish.transition_ticks = fish_surface_ticks * (3/4+Math.random()/2);
  fish.color = fish_surface_color;
  make_wave(fish.x,fish.y,fish.r,1);
}

var fishsubmerge = function(fish){
  fish.surfaced = false;
  fish.transition_ticks = fish_under_ticks * (3/4+Math.random()/2);
  fish.color = fish_submerge_color;
  make_wave(fish.x,fish.y,fish.r,1);
}

// wall 0 is +x, 1 is +y, 2 is -x, 3 is -y
var closest_wall = function(x,y){
  var wd = x;
  var wall = 2;
  if(y < wd)
  { wd = y;
    wall = 3;
  }
  if((screenwidth - x) < wd)
  { wd = screenwidth - x;
    wall = 0;
  }
  if((screenheight - y) < wd)
    wall = 1;
  return wall;
}

var distance_to_wall = function(x,y){
  var wd = x;
  if(y < wd)
    wd = y;
  if((screenwidth - x) < wd)
    wd = screenwidth - x;
  if((screenheight - y) < wd)
    wd = screenheight - y
  return wd;
}

var movecheckbounds = function(thing){
  thing.x += thing.xdot;
  thing.y += thing.ydot;

  if(thing.x - thing.r - thing.walldist < 0){
    thing.x -= thing.xdot;
    if(thing.xdot < 0)
      if(thing.bump_policy == "bounce")
        thing.xdot = -thing.xdot;
      else
        thing.xdot = 0;
  }

  if(thing.x + thing.r + thing.walldist > screenwidth){
    thing.x -= thing.xdot;
    if(thing.xdot > 0)
      if(thing.bump_policy == "bounce")
        thing.xdot = -thing.xdot;
      else
        thing.xdot = 0;
  }

  if(thing.y - thing.r - thing.walldist < 0){
    thing.y -= thing.ydot;
    if(thing.ydot < 0)
      if(thing.bump_policy == "bounce")
        thing.ydot = -thing.ydot;
      else
        thing.ydot = 0;
  }

  if(thing.y + thing.r + thing.walldist > screenheight){
    thing.y -= thing.ydot;
    if(thing.ydot > 0)
      if(thing.bump_policy == "bounce")
        thing.ydot = -thing.ydot;
      else
        thing.ydot = 0;
  }
}



var dostuff = function(){
  for(var i = 0; i < turtles.length; i++){
    if(turtles[i].pregnant){
      // closest_wall returns 0,1,2,3
      turtles[i].intended_direction = closest_wall(turtles[i].x, turtles[i].y)/2*Math.PI
    }

    var deltax = mousex - turtles[i].x;
    var deltay = mousey - turtles[i].y;
    var deltar2 = deltax * deltax + deltay * deltay;
    turtles[i].color = turtlecolor;
    if (deltar2 < mousearear2) {
      turtles[i].color = [64/256,128/256,64/256,1];
      var mousedirection = Math.atan2(deltay, deltax);
      turtles[i].intended_direction = -mousedirection
    }

    var direction = Math.atan2(turtles[i].ydot, turtles[i].xdot);
    if(turtles[i].intended_direction != 'undefined'){
      var amount_to_turn = turtles[i].intended_direction - direction;
      if(Math.abs(amount_to_turn) > 1/16)
        direction += amount_to_turn > 0 ? 1/16 : -1/16;
      else
        direction += amount_to_turn;
    }
    var wobble = (Math.random() * 2 - 1) * Math.PI * 2 / 32;
    var c = Math.cos(direction +  wobble);
    var s = Math.sin(direction +  wobble);
    turtles[i].xdot = c * turtlespeed;
    turtles[i].ydot = s * turtlespeed;
    movecheckbounds(turtles[i]);
    turtles[i].intended_direction = 'undefined';
    turtles[i].direction = direction;

    { // how do you make a for loop that conditionally ++s?
      var j = 0;
      while(j < foods.length){
        var deltax = turtles[i].x - foods[j].x;
        var deltay = turtles[i].y - foods[j].y;
        var deltar2 = deltax * deltax + deltay * deltay;
        if(deltar2 < turtles[i].r2 + foods[j].r2){
          turtles[i].energy += 1;
          foods.splice(j, 1);
          continue;
        }
        j++;
      }
    }

    for(var j=0; j<turtles[i].legs.length; j++){
      turtles[i].legs[j].orientation = turtles[i].legs[j].sorientation + 1/3*Math.cos(turtles[i].legs[j].strokephase);
      turtles[i].legs[j].strokephase += 1/turtlestroketicks;
      if(turtles[i].legs[j].strokephase > 2*Math.PI){
        if(turtles[i].legs[j].color != turtlecolor){
          turtles[i].legs[j].color = turtlecolor;
          var leg = turtles[i].legs[j];
          var c = Math.cos(turtles[i].direction);
          var s = Math.sin(turtles[i].direction);
          var offx = leg.attachx + Math.cos(leg.orientation)*leg.leglen;
          var offy = leg.attachy + Math.sin(leg.orientation)*leg.leglen;
          var tipx = turtles[i].x+ c*offx - s*offy;
          var tipy = turtles[i].y+ s*offx + c*offy;
          //make_wave(tipx,tipy,10);
        }
        else
          if(Math.random() > .9)
            turtles[i].legs[j].color = turtledipcolor;
      }
      turtles[i].legs[j].strokephase %= 2*Math.PI;
    }

    for(var j = 0; j < turtles.length; j++){
      if(j == i)
        continue;
      var deltax = turtles[i].x - turtles[j].x;
      var deltay = turtles[i].y - turtles[j].y;
      var deltar2 = deltax * deltax + deltay * deltay;
      if(deltar2 <= turtles[i].r2 + turtles[j].r2){
        maybemate(turtles[i], turtles[j]);
        var deltar = Math.sqrt(deltar2);
        turtles[i].xdot = deltax / deltar * turtlespeed;
        turtles[i].ydot = deltay / deltar * turtlespeed;
        turtles[j].xdot = -deltax / deltar * turtlespeed;
        turtles[j].ydot = -deltay / deltar * turtlespeed;
        movecheckbounds(turtles[i]);
        movecheckbounds(turtles[j]);
      }
    }

    if(turtles[i].pregnant){
      turtles[i].pregticks--;
      if(turtles[i].pregticks <= 0){
        if(distance_to_wall(turtles[i].x, turtles[i].y) < sandradius + turtleradius){
          makeegg(turtles[i].x, turtles[i].y);
          turtles[i].pregnant = false;
        }
      }
    }
  }

  for(var i=0; i<fishs.length; i++){
    fishs[i].transition_ticks--;
    var occluded = false;
    var smellfood = false;
    var transitiontime = false;
    var occludedfoods = [];
    for(var j=0; j<turtles.length; j++)
    { var deltax = turtles[j].x - fishs[i].x;
      var deltay = turtles[j].y - fishs[i].y;
      var deltar2 = deltax*deltax + deltay*deltay;
      var deltar = Math.sqrt(deltar2);
      if(deltar < fishs[i].r + turtles[j].r)
        occluded = true;
    }
    for(var j=0; j<fishs.length; j++)
    { if(j==i)
        continue;
      if(fishs[j].surfaced)
      { var deltax = fishs[j].x - fishs[i].x;
        var deltay = fishs[j].y - fishs[i].y;
        var deltar2 = deltax*deltax + deltay*deltay;
        var deltar = Math.sqrt(deltar2);
        if(deltar < fishs[i].r + fishs[j].r)
          occluded = true;
      }
    }
    for(var j=0; j<foods.length; j++)
    { var deltax = foods[j].x - fishs[i].x;
      var deltay = foods[j].y - fishs[i].y;
      var deltar2 = deltax*deltax + deltay*deltay;
      var deltar = Math.sqrt(deltar2) ;
      var deltaθ = Math.atan2(deltay, deltax);
      var bearing = (fishs[i].orientation - deltaθ)%(2*Math.PI);
      if(deltar < fishs[i].r * 3)
        smellfood = true;
      if((bearing < Math.PI/4 || bearing > 7*Math.PI/4) && deltar < fishs[i].r * 6)
        smellfood = true;
      if(deltar < fishs[i].r + foods[j].r){
        //console.log("Fish " + i + " occludes food " + j);
        occludedfoods.push(j);
      }
    }
    if(fishs[i].transition_ticks <= 0)
      transitiontime = true;
    if(occluded && fishs[i].surfaced)
    { //console.log("Submerging fish " + i + " because it crashed");
      fishsubmerge(fishs[i]);
      continue;
    }
    if(smellfood && !fishs[i].surfaced && !occluded)
    { if(fishs[i].transition_ticks < fish_surface_ticks*2/3)
      { //console.log("Surfacing fish " + i + " because it smells food")
        fishsurface(fishs[i]);
        continue;
      }
    }
    if(transitiontime && !fishs[i].surfaced && !occluded)
    { //console.log("Surfacing fish " + i + " because it's time to")
      fishsurface(fishs[i]);
      continue;
    }
    if(transitiontime && fishs[i].surfaced)
    { if(fishs[i].transition_ticks < -fish_surface_ticks/2 || !smellfood)
      { //console.log("Submerging fish " + i + " because it's time to");
        fishsubmerge(fishs[i]);
        continue;
      }
    }
    if(fishs[i].surfaced)
    { for(var j=occludedfoods.length-1; j>=0; j--)
      { //console.log("Fish " + i + " has eaten food " + j);
        foods.splice(occludedfoods[j],1);
      }
    }
    movecheckbounds(fishs[i]);
    fishs[i].direction = Math.atan2(fishs[i].ydot, fishs[i].xdot);
    fishs[i].spritephase += 1 / fish_spritephase_tick;
    fishs[i].spritephase %= 2*Math.PI;
  }

  for(var i = 0; i < foods.length; i++){
    var wobbleθ = Math.random() * Math.PI * 2;
    var wobbler = Math.random() * foodspeed / 5;
    var wobblex = wobbler * Math.cos(wobbleθ);
    var wobbley = wobbler * Math.sin(wobbleθ);
    foods[i].xdot += wobblex;
    foods[i].ydot += wobbley;
    var direction = Math.atan2(foods[i].ydot, foods[i].xdot);
    var speed = Math.sqrt(foods[i].ydot * foods[i].ydot + foods[i].xdot * foods[i].xdot);
    speed = speed < foodspeed ? speed : foodspeed;
    foods[i].xdot = speed * Math.cos(direction);
    foods[i].ydot = speed * Math.sin(direction);
    movecheckbounds(foods[i])
  }

  { // for loop that changes the length of the list lolol
    var i = 0;
    while(i < eggs.length){
      eggs[i].hatchticks--;
      if(eggs[i].hatchticks < 0){
        maketurtle(eggs[i].x, eggs[i].y);
        eggs.splice(i, 1);
        continue;
      }
      i++;
    }
  }
}

var drawblob = function(ctx, o){
  ctx.fillStyle = o.color
  ctx.beginPath()
  ctx.arc(o.x, o.y, o.r, 0, 2 * Math.PI, true)
  ctx.closePath()
  ctx.fill()
}

// non-square single images
var drawsprite_nonsquare = function(ctx, o, sprite, xs, ys){
  ctx.save();
  ctx.translate(o.x,o.y);
  ctx.rotate(o.direction+3/2*Math.PI);
  ctx.drawImage(sprite, 0,0,sprite.width, sprite.height,
                -xs*o.r, -ys*o.r, xs*2*o.r, ys*2*o.r);
  ctx.restore();
}

// horizontal lines of square sprites
var drawsprite_square = function(ctx, o, sprite, xs, ys){
  ctx.save();
  ctx.translate(o.x,o.y);
  ctx.rotate(o.direction+Math.PI);
  var spritelen = sprite.width/sprite.height;
  var si = Math.floor(o.spritephase*spritelen/(2*Math.PI));
  ctx.drawImage(sprite, si*sprite.height,0, sprite.height,sprite.height,
                -xs*o.r, -ys*o.r, xs*2*o.r, ys*2*o.r);
  ctx.restore();
}

var drawturtlelegs = function(ctx, turtle){
  ctx.save();
  ctx.translate(turtle.x,turtle.y);
  ctx.rotate(turtle.direction+3/2*Math.PI);
  for(var i=0; i<turtle.legs.length; i++){
    var leg = turtle.legs[i];
    ctx.moveTo(leg.attachx,leg.attachy);
    var farptx = leg.attachx + Math.cos(leg.orientation)*leg.leglen;
    var farpty = leg.attachy + Math.sin(leg.orientation)*leg.leglen;
    var coffx =  Math.sin(leg.orientation)*leg.leglen/3;
    var coffy = -Math.cos(leg.orientation)*leg.leglen/3;
    ctx.beginPath();
    ctx.bezierCurveTo(leg.attachx+coffx, leg.attachy+coffy,
                      farptx+coffx,      farpty+coffy,
                      farptx,            farpty);
    ctx.bezierCurveTo(farptx-coffx,      farpty-coffy,
                      leg.attachx-coffx, leg.attachy-coffy,
                      leg.attachx,       leg.attachy);
    ctx.closePath();
    ctx.fillStyle = leg.color;
    ctx.fill();
  }
  ctx.restore();
}

var drawstuff = function(){
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(200,150,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(0,64,255)";
  ctx.fillRect(sandradius, sandradius, canvas.width-2*sandradius, canvas.height-2*sandradius);

  for(var i=0; i<fishs.length; i++){
    if(fishs[i].surfaced){
      if(!fishsprite.complete || fishsprite.width == 0)
        drawblob(ctx, fishs[i]);
      else
        drawsprite_square(ctx, fishs[i], fishsprite, 1.7, 1.7);
    }
    //else{
    //  if(!fishsprite.complete || fishsprite.width == 0)
    //    drawblob(ctx, fishs[i]);
    //  else
    //    drawsprite_square(ctx, fishs[i], fishsprite, 1.4, 1.4);
    //}
  }

  for(var i=0; i<eggs.length; i++)
    drawblob(ctx, eggs[i]);

  for(var i=0; i<turtles.length; i++){
    drawturtlelegs(ctx, turtles[i]);
    if(!turtlesprite.complete || turtlesprite.width == 0)
      drawblob(ctx, turtles[i]);
    else
      drawsprite_nonsquare(ctx,turtles[i],turtlesprite,1.25,1.4);
  }

  for(var i=0; i<foods.length; i++)
    drawblob(ctx, foods[i]);
};

var xtogl = function(x){
  return x/screenwidth*2-1;
}

var ytogl = function(y){
  return y/screenheight*2-1;
}

var ogl_drawblob = function(o){
  gl.useProgram(sprogram.ellipse.program);
  gl.uniform2fv(sprogram.ellipse.u_xyoffset,[xtogl(o.x),ytogl(o.y)]);
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.ellipse.a_vertex);
  gl.vertexAttribPointer(sprogram.ellipse.a_vertex, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(sprogram.ellipse.u_color,o.color);
  gl.uniform1f(sprogram.ellipse.u_scale,2*o.r/screenwidth);
  gl.uniform1f(sprogram.ellipse.u_ar,1);
  gl.drawArrays(gl.TRIANGLES,0,6);
}

// non-square single images
var ogl_drawsprite = function(o, sprite, xs, ys){
  gl.useProgram(sprogram.sprite.program);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,sprite);
  gl.uniform1i(sprogram.sprite.u_tex,0);
  gl.uniform2fv(sprogram.sprite.u_xyoffset,[xtogl(o.x),ytogl(o.y)]);
  gl.uniform1f(sprogram.sprite.u_orientation,-o.direction+Math.PI);
  gl.uniform1f(sprogram.sprite.u_scale,xs*ys*o.r/screenwidth); // xs*ys*o.r/screenwidth
  gl.uniform1f(sprogram.sprite.u_ar,(xs/ys)*(xs/ys));
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.sprite.a_vertex);
  gl.vertexAttribPointer(sprogram.sprite.a_vertex, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES,0,6);
}

var ogl_drawturtlelegs = function(turtle){
  gl.useProgram(sprogram.ellipse.program);
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.ellipse.a_vertex);
  gl.vertexAttribPointer(sprogram.ellipse.a_vertex, 2, gl.FLOAT, false, 0, 0);
  var c = Math.cos(turtle.direction-Math.PI/2);
  var s = Math.sin(turtle.direction-Math.PI/2);
  for(var i=0; i<turtle.legs.length; i++){
    var leg = turtle.legs[i];
    var offx = leg.attachx + 1/2*Math.cos(leg.orientation)*leg.leglen;
    var offy = leg.attachy + 1/2*Math.sin(leg.orientation)*leg.leglen;
    var midx = xtogl(turtle.x+ c*offx - s*offy);
    var midy = ytogl(turtle.y+ s*offx + c*offy);
    gl.uniform2fv(sprogram.ellipse.u_xyoffset,[midx,midy]);
    gl.uniform1f(sprogram.ellipse.u_orientation,-turtle.direction-leg.orientation)
    gl.uniform1f(sprogram.ellipse.u_scale,leg.leglen/screenwidth);
    gl.uniform1f(sprogram.ellipse.u_ar,1.5);
    gl.uniform4fv(sprogram.ellipse.u_color,leg.color);
    gl.drawArrays(gl.TRIANGLES,0,6);

    /*gl.useProgram(sprogram.ellipse.program);
    gl.uniform2fv(sprogram.ellipse.u_xyoffset,[xtogl(turtle.x+c*leg.attachx-s*leg.attachy),
                                               ytogl(turtle.y+s*leg.attachx+c*leg.attachy)]);
    gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
    gl.enableVertexAttribArray(sprogram.ellipse.a_vertex);
    gl.vertexAttribPointer(sprogram.ellipse.a_vertex, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(sprogram.ellipse.u_color,[1,0,0,1]);
    gl.uniform1f(sprogram.ellipse.u_scale,3/screenwidth);
    gl.uniform1f(sprogram.ellipse.u_ar,1.5);
    gl.drawArrays(gl.TRIANGLES,0,6);  */
  }
} 

var ogl_drawstuff = function(){
  gl.bindFramebuffer(gl.FRAMEBUFFER,wave.o.fbuf);
  gl.viewport(0,0,wave.o.fbuf.width,wave.o.fbuf.height);
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(sprogram.simple.program);
  gl.uniform2fv(sprogram.simple.u_xyoffset,[0,0]);
  gl.uniform1f(sprogram.simple.u_orientation,0);
  gl.uniform1f(sprogram.simple.u_scale,1);
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.simple.a_vertex);
  gl.vertexAttribPointer(sprogram.simple.a_vertex, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(sprogram.simple.u_color,sandcolor);
  gl.drawArrays(gl.TRIANGLES,0,6);
  gl.uniform1f(sprogram.simple.u_scale,1-2*sandradius/screenwidth);
  gl.uniform4fv(sprogram.simple.u_color,watercolor);
  gl.drawArrays(gl.TRIANGLES,0,6);

  for(var i=0; i<fishs.length; i++){
    if(fishs[i].surfaced){
      if(!sprites.fish.tex)
        ogl_drawblob(fishs[i]);
      else{
        var si = Math.floor(fishs[i].spritephase*sprites.fish.tex.length/(2*Math.PI));
        ogl_drawsprite(fishs[i], sprites.fish.tex[si], 1.7, 1.7);
      }
    }
    //else{
    //  if(!fishsprite.complete || fishsprite.width == 0)
    //    drawblob(ctx, fishs[i]);
    //  else
    //    drawsprite_square(ctx, fishs[i], fishsprite, 1.4, 1.4);
    //}
  }

  for(var i=0; i<eggs.length; i++)
    ogl_drawblob(eggs[i]);

  for(var i=0; i<turtles.length; i++){
    ogl_drawturtlelegs(turtles[i]);
    if(!sprites.turtle.tex)
      ogl_drawblob(turtles[i]);
    else
      ogl_drawsprite(turtles[i],sprites.turtle.tex[0],1.25,1.4);
  }

  for(var i=0; i<foods.length; i++)
    ogl_drawblob(foods[i]);



  //drawtexture(wave.o.tex,null);

  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(0,0,screenwidth,screenheight);
  gl.useProgram(sprogram.wave_display.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,wave.o.tex);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D,wave.c.tex);
  gl.uniform1i(sprogram.wave_display.u_fb,0);
  gl.uniform1i(sprogram.wave_display.u_wave,1);
  gl.uniform4fv(sprogram.wave_display.u_background,watercolor);
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.wave_display.a_vertex);
  gl.vertexAttribPointer(sprogram.wave_display.a_vertex,2,gl.FLOAT,false,0,0);
  gl.uniform1f(sprogram.wave_display.u_scale,1);
  gl.uniform1f(sprogram.wave_display.u_orientation,0);
  gl.uniform1f(sprogram.wave_display.u_ar,1);
  gl.uniform2fv(sprogram.wave_display.u_xyoffset,[0,0]);
  gl.drawArrays(gl.TRIANGLES,0,6);
};



var mainloop = function(){
  dostuff();
  wavesim();
  ogl_drawstuff();
  setTimeout(function(){mainloop();}, tickmillis);
};


var wavesim = function(){
  gl.bindFramebuffer(gl.FRAMEBUFFER,wave.n.fbuf);
  gl.viewport(0,0,wave.n.fbuf.width,wave.n.fbuf.height);
  gl.useProgram(sprogram.wave_sim.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,wave.c.tex);
  gl.uniform1i(sprogram.wave_sim.u_u,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.wave_sim.a_vertex);
  gl.vertexAttribPointer(sprogram.wave_sim.a_vertex,2,gl.FLOAT,false,0,0);
  gl.uniform1f(sprogram.wave_sim.u_scale,1);
  gl.uniform1f(sprogram.wave_sim.u_ar,1);
  gl.uniform1f(sprogram.wave_sim.u_orientation,0);
  gl.uniform2fv(sprogram.wave_sim.u_xyoffset,[0,0]);
  gl.uniform1f(sprogram.wave_sim.u_tick,.05);
  gl.uniform1f(sprogram.wave_sim.u_pxc,wave.c.fbuf.width);
  gl.drawArrays(gl.TRIANGLES,0,6);

  drawtexture(wave.n.tex, wave.c.fbuf);
}

var make_wave = function(ix,iy,ir,amp){
  var x = xtogl(ix);
  var y = xtogl(iy);
  var r = ir/screenwidth;
  gl.bindFramebuffer(gl.FRAMEBUFFER,wave.c.fbuf);
  gl.viewport(0,0,wave.c.fbuf.width,wave.c.fbuf.height);
  gl.useProgram(sprogram.waveic.program);
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.waveic.a_vertex);
  gl.vertexAttribPointer(sprogram.waveic.a_vertex,2,gl.FLOAT,false,0,0);
  gl.uniform1f(sprogram.waveic.u_scale,r);
  gl.uniform1f(sprogram.waveic.u_orientation,0);
  gl.uniform1f(sprogram.waveic.u_ar,1);
  gl.uniform2fv(sprogram.waveic.u_xyoffset,[x,y]);
  gl.uniform1f(sprogram.waveic.u_amp,amp);
  gl.uniform4fv(sprogram.waveic.u_color,[0,0,1,1]);
  gl.drawArrays(gl.TRIANGLES,0,6);
 }



var wave = {};
var setup_drawing = function(){
  gl = canvas.getContext("webgl");
  gl.getExtension("OES_texture_float");
  for(key in sprogram){
    sprogram[key] = load_shader_program(sprogram[key].frag,sprogram[key].vert);
  }
  offscreen_canvas = document.createElement("canvas");
  while(totex.length > 0){
    var tx = totex.pop();
    maketextures(tx[0],tx[1]);
  }
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([1,-1, 1,1, -1,1, -1,1, -1,-1, 1,-1]),gl.STATIC_DRAW);
  shapes["square"] = {buf: buf};
  var txx = ["c","n","d","o"];
  for(var i=0; i<txx.length; i++){
    wave[txx[i]] = {};
  	var w = wave[txx[i]];
    w.fbuf = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, w.fbuf);
    if(txx[i] == "c" || txx[i] == "n"){
      w.fbuf.width = 256;
      w.fbuf.height = 256;
    } else {
      w.fbuf.width = screenwidth;
      w.fbuf.height = screenheight;
    }
    w.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,w.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//    gl.texParameterfv(gl.TEXTURE_2D, gl.TEXTURE_BORDER_COLOR, [0,0,0,0]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    if(txx[i] == "c" || txx[i] == "n"){
      var ttype = gl.FLOAT;
    } else {
      var ttype = gl.UNSIGNED_BYTE;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w.fbuf.width, w.fbuf.height,
                  0, gl.RGBA, ttype, null);
    w.rbuf = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, w.rbuf);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                           w.fbuf.width, w.fbuf.height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
                            w.tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,
                               w.rbuf);
    var s = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(s != gl.FRAMEBUFFER_COMPLETE){
      console.log(s);
    }
    gl.useProgram(sprogram.simple.program);
    gl.uniform2fv(sprogram.simple.u_xyoffset,[0,0]);
    gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
    gl.enableVertexAttribArray(sprogram.simple.a_vertex);
    gl.vertexAttribPointer(sprogram.simple.a_vertex, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(sprogram.simple.u_color,[.5,.5,.5,1]);
    gl.uniform1f(sprogram.simple.u_scale,1);
    gl.uniform1f(sprogram.simple.u_ar,1);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
}

var drawtexture = function(tex, fb){
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  if(fb != null)
    gl.viewport(0,0,fb.width,fb.height);
  else
    gl.viewport(0,0,screenwidth,screenheight);
  gl.useProgram(sprogram.sprite.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.uniform1i(sprogram.sprite.u_tex,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,shapes.square.buf);
  gl.enableVertexAttribArray(sprogram.sprite.a_vertex);
  gl.vertexAttribPointer(sprogram.sprite.a_vertex,2,gl.FLOAT,false,0,0);
  gl.uniform1f(sprogram.sprite.u_scale,1);
  gl.uniform1f(sprogram.sprite.u_orientation,0);
  gl.uniform1f(sprogram.sprite.u_ar,1);
  gl.uniform2fv(sprogram.sprite.u_xyoffset,[0,0]);
  gl.drawArrays(gl.TRIANGLES,0,6);
}