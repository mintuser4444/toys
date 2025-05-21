precision mediump float;

varying vec2 v_texCoord;
uniform vec4 u_background;
uniform sampler2D u_fb;
uniform sampler2D u_wave;

void main() {
  vec4 f = texture2D(u_fb,v_texCoord);
  vec4 w = texture2D(u_wave,v_texCoord);
  if(distance(f.rgb,u_background.rgb) < .01)
    gl_FragColor = vec4(f.r,f.g,f.b+w.b-.5,1.0);
  else
    gl_FragColor = f;
}
