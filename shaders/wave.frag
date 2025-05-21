precision highp float;

varying vec2 v_texCoord;
uniform sampler2D u_u;
uniform float u_tick;
uniform float u_pxc;

// [x ]' = [0  1][x ]
// [x']  = [k -d][x']
// spurious vibrations
// u_tt = u_xx + u_yy
// -u(t+1)+2u-u(t-1) = lap(u)
// u(t+1) = lap(u)-2u+u(t-1);

void main() {
  float x = v_texCoord.x;
  float y = v_texCoord.y;
  float p = 1.0/u_pxc;

  float uxx =     texture2D(u_u,vec2(x  ,y  )).b-.5;
  uxx -=      .5*(texture2D(u_u,vec2(x+p,y  )).b-.5);
  uxx -=      .5*(texture2D(u_u,vec2(x  ,y+p)).b-.5);
  float uyy =     texture2D(u_u,vec2(x  ,y  )).b-.5;
  uyy -=      .5*(texture2D(u_u,vec2(x-p,y  )).b-.5);
  uyy -=      .5*(texture2D(u_u,vec2(x  ,y-p)).b-.5);
  float lap = (uxx+uyy)/sqrt(5.0);

  float g0 = texture2D(u_u,v_texCoord).g-.5;
  float b0 = texture2D(u_u,v_texCoord).b-.5;
  float r=0.0;
  float g=0.0;
  float b=0.0;
  float k = 1.0;
  float d = 0.03;
  float dt = .4;

  b = b0 + dt*g0 - dt*.4*lap;
  g = g0 - dt*k*lap - dt*d*g0 - dt*d*.25*b0;

  gl_FragColor = vec4(0.0,g+.5,b+.5,1.0);
  //vec4 color = gl_FragCoord/u_pxc;
  //color.a = 1.0;
  //gl_FragColor = color;
}
