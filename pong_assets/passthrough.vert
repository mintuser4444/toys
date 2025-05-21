attribute vec3 a_vertex;
uniform mat4 uView;

void main(){

  gl_Position = uView * vec4(a_vertex.x, a_vertex.y, a_vertex.z, 1);
}
