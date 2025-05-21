attribute vec2 a_vertex;

uniform vec2 u_xyoffset;
uniform float u_scale;
uniform float u_orientation;

void main() {
  float x = u_scale*dot(
    vec2(cos(u_orientation),sin(u_orientation)),
    a_vertex
  )-u_xyoffset.x;
  float y = u_scale*dot(
    vec2(-sin(u_orientation),cos(u_orientation)),
    a_vertex
  )-u_xyoffset.y;
  gl_Position = vec4(x,y,1,1);
}
