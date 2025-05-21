precision highp float;

varying vec2 v_texCoord;
uniform sampler2D u_tex;
uniform float u_pxc;

void main() {
  float x = v_texCoord.x;
  float y = v_texCoord.y;
  float p = 1.0/u_pxc;

  vec4 acc = vec4(0,0,0,0);
  acc += texture2D(u_tex,vec2(2.0*x  , 2.0*y  ));
  acc += texture2D(u_tex,vec2(2.0*x+p, 2.0*y  ));
  acc += texture2D(u_tex,vec2(2.0*x  , 2.0*y+p));
  acc += texture2D(u_tex,vec2(2.0*x+p, 2.0*y+p));
  gl_FragColor = acc;
}
