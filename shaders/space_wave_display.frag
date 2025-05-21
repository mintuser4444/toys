precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_fb;
uniform sampler2D u_wave;
uniform vec2 u_viewOffset;
uniform float u_viewScale;

void main() {
  vec4 f = texture2D(u_fb,v_texCoord);
  vec2 moved = v_texCoord + u_viewOffset;
  vec2 scaled = moved * u_viewScale;
  vec4 w = texture2D(u_wave,scaled);
  gl_FragColor = vec4(f.r,f.g,f.b+(w.b-.5),1.0);
  //gl_FragColor = dot(f,f) < 1.5 ? w : f;
}