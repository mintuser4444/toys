attribute vec3 a_vertex;
uniform mat4 u_view;

void main(){
  gl_Position =  u_view * vec4(a_vertex.x, a_vertex.y, a_vertex.z, 1);
}
