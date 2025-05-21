precision highp float;

varying vec2 v_texCoord;
uniform sampler2D u_cur;
uniform sampler2D u_old;
float u_tick;


// [x ]' = [0  1][x ]
// [x']  = [k -d][x']
// spurious vibrations
// u_tt = u_xx + u_yy
// -u(t+1)+2u-u(t-1) = lap(u)
// u(t+1) = lap(u)-2u+u(t-1);

void main() {
  float x = v_texCoord.x;
  float y = v_texCoord.y;
  float p = 1.0/512.0;

  float uxx =     texture2D(u_cur,vec2(x  ,y  )).b-.5;
  uxx -=      .5*(texture2D(u_cur,vec2(x+p,y  )).b-.5);
  uxx -=      .5*(texture2D(u_cur,vec2(x  ,y+p)).b-.5);
  float uyy =     texture2D(u_cur,vec2(x  ,y  )).b-.5;
  uyy -=      .5*(texture2D(u_cur,vec2(x-p,y  )).b-.5);
  uyy -=      .5*(texture2D(u_cur,vec2(x  ,y-p)).b-.5);
  float lap = (uxx+uyy)/sqrt(5.0);
  float olap = 2.0*(texture2D(u_old,vec2(x  ,y  )).b-.5);
  olap -=       .5*(texture2D(u_old,vec2(x+p,y  )).b-.5);
  olap -=       .5*(texture2D(u_old,vec2(x  ,y+p)).b-.5);
  olap -=       .5*(texture2D(u_old,vec2(x-p,y  )).b-.5);
  olap -=       .5*(texture2D(u_old,vec2(x  ,y-p)).b-.5);
  olap /= sqrt(5.0);


  float r0 = texture2D(u_cur,v_texCoord).r-.5;
  float g0 = texture2D(u_cur,v_texCoord).g-.5;
  float b0 = texture2D(u_cur,v_texCoord).b-.5;
  float r=0.0;
  float g=0.0;
  float b=0.0;

  //float b0 = texture2D(u_cur,v_texCoord).b-.5;
  //float g0 = texture2D(u_cur,v_texCoord).g-.5;
  //float b = b0+.05*g0;
  //float g = g0+.05*(-lap-.1*b0);

  // u_tt + u = 0
  // (-u_t+ + 2u_t0 - u_t-)/sqrt(6) + ku = 0
  // u_t+/sqrt(6) = (2u_t0 - u_t-)/sqrt(6) + ku_t0 = 0
  // u_t+ = sqrt(6)(2/sqrt(6)+k)u_t0 - u_t-
  //float s6 = sqrt(6.0);
  //float bl = texture2D(u_old,v_texCoord).b-.5;

  //float b = s6*(2.0/s6+1.0)*b0 - bm;
  //float k = .05;
  //b = (2.0-s6*k)*lap - olap - .5*(b0-bl);
  //b = (2.0-k*lap-k*b0)*b0 - bl;
  //float rl = texture2D(u_old,v_texCoord).r-.5;
  //float gl = texture2D(u_old,v_texCoord).g-.5;


  //float rp = texture2D(u_cur,vec2(x+p,y  )).r-.5;
  //float rm = texture2D(u_cur,vec2(x-p,y  )).r-.5;
  //float gp = texture2D(u_cur,vec2(x  ,y+p)).g-.5;
  //float gm = texture2D(u_cur,vec2(x  ,y-p)).g-.5;
  //float bp = texture2D(u_cur,vec2(x+p,y  )).b-.5;
  //float bm = texture2D(u_cur,vec2(x-p,y  )).b-.5;


  //float t = .1;
  //r = r0 + t*(rp-rm) - t*uxx;
  //g = g0 + t*(gp-gm) - t*uyy;
  //b = b0 + t*(clamp(rm,0.0,1.0)+clamp(rp,-1.0,0.0)
  //           +clamp(gm,0.0,1.0)+clamp(gp,-1.0,0.0)
  //           -abs(r0)-abs(g0));
  //float a = .1;
  //float bn = b0 - a*(bp-b0);
  //float bnm = bm - a*(b0-bm);
  //b = (b0 + bn)/2.0 - a/2.0*(bn - bnm);
  float k = 1.0;
  float d = 0.03;
  float dt = .4;

  b = b0 + dt*g0 - dt*.4*lap;
  g = g0 - dt*k*lap - dt*d*g0 - dt*d*.25*b0;

  gl_FragColor = vec4(r0+.5,g+.5,b+.5,1.0);
}
