precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_fb;
uniform sampler2D u_wave;

void main() {
  vec4 f = texture2D(u_fb,v_texCoord);
  vec4 w = texture2D(u_wave,v_texCoord);
  //gl_FragColor = vec4(f.r,f.g-(w.b-.5),f.b+(w.b-.5),1.0);
  gl_FragColor = dot(f,f) > 1.1 ? f : w;
}
