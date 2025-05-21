precision mediump float;

varying vec2 v_texCoord;

uniform vec4 u_color;

void main() {
  float x = v_texCoord.x*2.0-1.0;
  float y = v_texCoord.y*2.0-1.0;
  if(x*x + y*y <= 1.0)
    gl_FragColor = u_color;
  else
    gl_FragColor = vec4(0.0,0.0,0.0,0.0);
}
