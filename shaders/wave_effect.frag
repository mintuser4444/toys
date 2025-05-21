precision highp float;

varying vec2 v_texCoord;
uniform sampler2D u_wave;
uniform sampler2D u_tex;
uniform vec2 u_location;
uniform float u_pxc;
uniform float u_shrink;

void main() {
  vec4 texuv = texture2D(u_tex, v_texCoord);
  float texAmt = dot(texuv, texuv);
  if(texAmt < 1.05){
    gl_FragColor = vec4(0,0,0,1);
  } else {
    vec2 waveCoords = gl_FragCoord.xy/u_pxc;
    float b = texture2D(u_wave, waveCoords).b;
    vec2 dirDist = waveCoords - u_location;
    vec2 dir = dirDist / sqrt(dot(dirDist, dirDist));
    gl_FragColor = vec4(1.0*u_shrink, (dir.x*b*.5+.5)*u_shrink, (dir.y*b*.5+.5)*u_shrink, 1.0);
  }
}
