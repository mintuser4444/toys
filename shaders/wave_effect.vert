attribute vec2 a_vertex;

varying vec2 v_texCoord;

uniform vec2 u_xyoffset;
uniform float u_scale;
uniform float u_orientation;
uniform float u_ar;

void main() {
  float ar = sqrt(u_ar);
  float x = u_scale*dot(
    vec2(1.0/ar*cos(u_orientation),ar*sin(u_orientation)),
    a_vertex
  )-u_xyoffset.x;
  float y = u_scale*dot(
    vec2(1.0/ar*-sin(u_orientation),ar*cos(u_orientation)),
    a_vertex
  )-u_xyoffset.y;
  gl_Position = vec4(x,y,1,1);
  v_texCoord = a_vertex*.5+vec2(.5,.5);
}