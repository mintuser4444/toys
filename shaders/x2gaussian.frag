precision mediump float;

varying vec2 v_texCoord;
uniform vec4 u_color;
uniform float u_amp;

void main(){
  float x = v_texCoord.x*2.0-1.0;
  float y = v_texCoord.y*2.0-1.0;
  gl_FragColor = u_color;
  gl_FragColor.a *= u_amp*(x*x+y*y)*exp(-2.0*x*x - 2.0*y*y);
}
