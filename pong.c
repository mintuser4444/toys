#include <GL/glew.h> // glewInit configures function pointers
#include <GL/gl.h>
#include <GL/glu.h> // for gluErrorString
#include <SDL2/SDL.h>
#include <stdio.h>
#include <math.h>
#include <unistd.h> // unistd and stat.h are needed for stat
#include <fcntl.h>
#include <errno.h>
#include <sys/stat.h>
#include <termio.h> // FIONREAD ioctl

#define PI 3.141592653589793238462643383279502884197

SDL_Window *window;
SDL_GLContext ctx;

void quit(int exitcode){
  SDL_GL_DeleteContext(ctx);
  SDL_DestroyWindow(window);
  SDL_Quit();
  exit(exitcode);
}

void print_gl_error(char* userdata){
  GLenum error = glGetError();
  if(error)
    printf("GL error: %s (at %s)\n", gluErrorString(error), userdata);
}

void dump_shader_info_log(FILE *file, GLuint shader){
  GLint infolen;
  glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infolen);
  char *infolog = malloc(infolen);
  glGetShaderInfoLog(shader, infolen, NULL, infolog);
  fprintf(file, "%s",infolog);
  free(infolog);
}

void dump_program_info_log(FILE *file, GLuint shader_program){
  GLint infolen = 0;
  glGetProgramiv(shader_program, GL_INFO_LOG_LENGTH, &infolen);
  char* infolog = malloc(infolen);
  glGetProgramInfoLog(shader_program, infolen, NULL, infolog);
  fprintf(file, "%s\n", infolog);
  free(infolog);
}

GLuint loadshader(char* filepath, GLuint type){
  struct stat s;
  stat(filepath,&s);
  FILE* f = fopen(filepath,"r");
  char* source = malloc(s.st_size);
  if(!source){
    fprintf(stderr, "can't allocate shader buffer");
    quit(1);
  }
  fread(source,1,s.st_size,f);
  fclose(f);
  GLint compiled;
  GLuint shader = glCreateShader(type);
  GLint ssize = s.st_size;
  glShaderSource(shader, 1, &source, &ssize);
  free(source);
  glCompileShader(shader);
  glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);
  if(!compiled){
    fprintf(stderr, "error compiling shader %s\n", filepath);
    dump_shader_info_log(stderr,shader);
    quit(-1);
  } else {
    fprintf(stdout, "shader info log for %s\n", filepath);
    dump_shader_info_log(stdout,shader);
  }
  return shader;
}


void link_and_print(GLuint shader_program){
  glLinkProgram(shader_program);
  GLuint linked;
  glGetProgramiv(shader_program, GL_LINK_STATUS, &linked);
  if(!linked){
    fprintf(stderr,"error creating program");
    dump_program_info_log(stderr, shader_program);
    quit(-1);
  } else {
    GLint infolen = 0;
    glGetProgramiv(shader_program, GL_INFO_LOG_LENGTH, &infolen);
    if(infolen != 0){
      fprintf(stderr, "program info log:\n");
      dump_program_info_log(stdout,shader_program);
    }
  }
}


int main(void){
  if(SDL_Init(SDL_INIT_VIDEO)<0){
    fprintf(stderr, "Couldn't init SDL2: %s/n", SDL_GetError());
    return -1;
  }
  window = SDL_CreateWindow(".: pong :.", SDL_WINDOWPOS_CENTERED,
                            SDL_WINDOWPOS_CENTERED, 640,480, SDL_WINDOW_OPENGL);
  SDL_GLContext ctx = SDL_GL_CreateContext(window);
  glewExperimental = GL_TRUE;
  glewInit();
  glClearColor(0,0,0,1);
  glClear(GL_COLOR_BUFFER_BIT);
  print_gl_error("initialization");
  SDL_GL_SwapWindow(window);

  float ballrad = .125;
  /*int balltris = 16;
  float rballtris = 1./balltris;
  GLfloat ball[3*3*balltris];
  for(int i=0; i<balltris; i++){
    for(int j=0; j<2; j++){
      ball[3*3*i+3*j+0] = ballrad*cos(2*PI*(i+j)*rballtris);
      ball[3*3*i+3*j+1] = ballrad*sin(2*PI*(i+j)*rballtris);
      ball[3*3*i+3*j+2] = 0;
    }
    for(int j=0; j<3; j++){
      ball[3*3*i+3*2+j] = 0;
    }
  }*/


  int balltris = 20;
  float theta = 72*PI/180;
  float phi = PI/2-theta;
  float z = ballrad*cos(phi);
  float xy = ballrad*sin(phi);
  float ballvertices[3*12] = {
  //ballvertices[0] = {0,0,ballrad};
  //for(int i=1;i<6;i++)
  //  ballvertices[i] = {xy*cos(theta*(i-1)),xy*sin(theta*(i-1)),z};
  //for(int i=6;i<11;i++)
  //  ballvertices[i] = {xy*cos(theta*(.5+i-6),xy*sin(theta*.5+i-6),z};
  //ballvertices[11] = {0,0,-ballrad};
    0,                 0,                  ballrad, // 0
    xy,                0,                  z      , // 1
    xy*cos(theta),     xy*sin(theta),      z      , // 2
    xy*cos(2*theta),   xy*sin(2*theta),    z      , // 3
    xy*cos(3*theta),   xy*sin(3*theta),    z      , // 4
    xy*cos(4*theta),   xy*sin(4*theta),    z      , // 5
    xy*cos(.5*theta),  xy*sin(.5*theta),  -z      , // 6
    xy*cos(1.5*theta), xy*sin(1.5*theta), -z      , // 7
    xy*cos(2.5*theta), xy*sin(2.5*theta), -z      , // 8
    xy*cos(3.5*theta), xy*sin(3.5*theta), -z      , // 9
    xy*cos(4.5*theta), xy*sin(4.5*theta), -z      , //10
    0,                 0,                 -ballrad  //11
  };


  //for(int i=1; i<5; i++)
  //  mesh[   i] = {0  ,i+1,i+2};
  //for(int i=1; i<5; i++)
  //  mesh[ 5+i] = {i+1,i+2,i+6};
  //for(int i=1; i<5; i++)
  //  mesh[10+i] = {i+1,i+6,i+7};
  //for(int i=1; i<5; i++)
  //  mesh[15+i] = {i+5,i+6, 11};

  int mesh[3*20] = {
     0, 5, 1,
     0, 1, 2,
     0, 2, 3,
     0, 3, 4,
     0, 4, 5,

     5, 1, 6,
     1, 2, 7,
     2, 3, 8,
     3, 4, 9,
     4, 5,10,

     1,10, 6,
     2, 6, 7,
     3, 7, 8,
     4, 8, 9,
     5, 9,10,

    10, 6,11,
     6, 7,11,
     7, 8,11,
     8, 9,11,
     9,10,11
  };

  GLfloat ball[3*3*20];
  for(int i=0;i<20;i++)
    for(int j=0; j<3; j++)
      for(int k=0; k<3; k++)
        ball[9*i+3*j+k] = ballvertices[3*mesh[3*i+j]+k];

  float paddleh = .4;
  float paddlew = .025;
  int paddletris = 2;
  GLfloat paddle[] = {-paddlew,  paddleh, 0,
                       paddlew,  paddleh, 0,
                      -paddlew, -paddleh, 0,

                      -paddlew, -paddleh, 0,
                       paddlew,  paddleh, 0,
                       paddlew, -paddleh, 0};

  GLuint ball_vbo;
  glGenBuffers(1, &ball_vbo);
  print_gl_error("ball vbo buffer create");
  glBindBuffer(GL_ARRAY_BUFFER, ball_vbo);
  print_gl_error("ball vbo buffer bind");
  glBufferData(GL_ARRAY_BUFFER, sizeof(ball), ball, GL_STATIC_DRAW);
  print_gl_error("ball vbo buffer data");

  GLuint ball_vao;
  glGenVertexArrays(1,&ball_vao);
  print_gl_error("ball vao create array");
  glBindVertexArray(ball_vao);
  print_gl_error("ball vao bind array");
  glEnableVertexAttribArray(0);
  print_gl_error("ball vao enable array");
  glBindBuffer(GL_ARRAY_BUFFER,ball_vbo);
  print_gl_error("ball vao bind buffer");
  glVertexAttribPointer(0,3,GL_FLOAT,GL_FALSE,0,NULL);
  print_gl_error("ball vao attrib pointer");

  GLuint paddle_vbo;
  glGenBuffers(1, &paddle_vbo);
  glBindBuffer(GL_ARRAY_BUFFER, paddle_vbo);
  glBufferData(GL_ARRAY_BUFFER, sizeof(paddle), paddle, GL_STATIC_DRAW);
  GLuint paddle_vao;
  glGenVertexArrays(1,&paddle_vao);
  glBindVertexArray(paddle_vao);
  glEnableVertexAttribArray(0);
  glBindBuffer(GL_ARRAY_BUFFER, paddle_vao);
  glVertexAttribPointer(0,3,GL_FLOAT,GL_FALSE,0,NULL);
  print_gl_error("paddle");

  GLuint vs = loadshader("pong_assets/viewmatmul.vert", GL_VERTEX_SHADER);
  GLuint fs = loadshader("pong_assets/green.frag", GL_FRAGMENT_SHADER);

  GLuint ball_shader_program = glCreateProgram();
  glAttachShader(ball_shader_program, vs);
  //glAttachShader(ball_shader_program, loadshader("pong_assets/ball.tess", GL_TESSELATION_SHADER));
  glAttachShader(ball_shader_program, fs);
  link_and_print(ball_shader_program);
  print_gl_error("ball shader");

  GLuint paddle_shader_program = glCreateProgram();
  glAttachShader(paddle_shader_program, vs);
  glAttachShader(paddle_shader_program, fs);
  link_and_print(paddle_shader_program);
  print_gl_error("paddle_shader");


  int have_arduino = 0;
  int arduinobuflen = 512;
  char arduinodata[arduinobuflen];
  char arduinoline[64];
  char number0s[8];
  char number1s[8];
  int number0;
  int number1;
  int arduinopos=0;
  unsigned long totaldata;
  int arduino = open("/dev/ttyACM0", O_RDONLY | O_NOCTTY | O_NONBLOCK);
  if(arduino != -1)
    have_arduino = 1;

  float ballpos[2] = {0,0};
  float ballvel[2] = {1,0};
  float paddle0pos = 0;
  float paddle1pos = 0;
  float u_view[4*4] = {1,0,0,0,
                       0,1,0,0,
                       0,0,1,0,
                       0,0,0,1};

  GLint ball_u_viewLoc   = glGetUniformLocation(ball_shader_program,  "u_view");
  GLint paddle_u_viewLoc = glGetUniformLocation(paddle_shader_program,"u_view");
  print_gl_error("getting uniforms");

  Uint32 oldtime = SDL_GetTicks();
  Uint32 newtime;
  int paddle0input;
  int paddle1input;

  int camerapitch;
  int camerayaw;
  int cameraroll;
  int cameraforward;
  int camerastrafe;
  int camerafly;
  while(1){
    // input
    SDL_Event evt;
    while(SDL_PollEvent(&evt)){
      if(evt.type == SDL_QUIT)
        quit(0);
      Uint8 *keys = SDL_GetKeyboardState(NULL);
      paddle0input = 0;
      if(keys[SDL_SCANCODE_A]){
        printf("currently pressing A");
        paddle0input = 1;
      }
      if(keys[SDL_SCANCODE_Z])
        paddle0input = -1;
      paddle1input = 0;
      if(keys[SDL_SCANCODE_UP])
        paddle1input = 1;
      if(keys[SDL_SCANCODE_DOWN])
        paddle1input = -1;

      // special debugging commands
      if     (keys[SDL_SCANCODE_I    ] && !keys[SDL_SCANCODE_K    ])
        camerapitch   =  1;
      else if(keys[SDL_SCANCODE_K    ] && !keys[SDL_SCANCODE_I    ])
        camerapitch   = -1;
      if     (keys[SDL_SCANCODE_J    ] && !keys[SDL_SCANCODE_L    ])
        camerayaw     =  1;
      else if(keys[SDL_SCANCODE_L    ] && !keys[SDL_SCANCODE_J    ])
        camerayaw     = -1;
      if     (keys[SDL_SCANCODE_U    ] && !keys[SDL_SCANCODE_O    ])
        cameraroll    =  1;
      else if(keys[SDL_SCANCODE_O    ] && !keys[SDL_SCANCODE_U    ])
        cameraroll    = -1;
      if     (keys[SDL_SCANCODE_E    ] && !keys[SDL_SCANCODE_D    ])
        cameraforward =  1;
      else if(keys[SDL_SCANCODE_D    ] && !keys[SDL_SCANCODE_E    ])
        cameraforward = -1;
      if     (keys[SDL_SCANCODE_S    ] && !keys[SDL_SCANCODE_F    ])
        camerastrafe  =  1;
      else if(keys[SDL_SCANCODE_F    ] && !keys[SDL_SCANCODE_S    ])
        camerastrafe  = -1;
      if     (keys[SDL_SCANCODE_SPACE] && !keys[SDL_SCANCODE_LCTRL])
        camerafly     =  1;
      else if(keys[SDL_SCANCODE_LCTRL] && !keys[SDL_SCANCODE_SPACE])
        camerafly     = -1;
    }
    if(have_arduino){
      // read data into ringbuffer
      int availabledata;
      ioctl(arduino,FIONREAD, &availabledata);
      while(availabledata > 512){
        totaldata += read(arduino,arduinodata,512);
        arduinopos = 0;
      }
      if(availabledata > 0){
        int getdata = (availabledata>arduinobuflen-arduinopos)?(arduinobuflen-arduinopos):availabledata;
        availabledata -= getdata;
        int datalen = read(arduino, arduinodata+arduinopos, getdata);
        arduinopos += datalen;
        totaldata += datalen;
      }
      if(availabledata > 0){
        int datalen = read(arduino,arduinodata, availabledata);
        arduinopos = datalen;
        totaldata += datalen;
      }
      int print_width = 32;
      /*
      printf("ringbuffer contents: \n");
      for(int i=0; i<sizeof(arduinodata); i+=print_width){
        printf("%4x ", i);
        int j=0;
        for(; j<print_width/2; j++){
          unsigned char x = arduinodata[i+j];
          printf("%x", x>>4);
          printf("%x", x&15);
        }
        printf(" ");
        for(; j<print_width/2; j++){
          unsigned char x = arduinodata[i+j];
          printf("%x", x>>4);
          printf("%x", x&15);
        }
        putchar(' ');
        for(int j=0; j<print_width; j++){
          unsigned char x = arduinodata[i+j];
          if(isprint(x))
            putchar(x);
          else
            putchar('.');
        }
        putchar('\n');
      }
      printf("ringbuffer position: 0x%x\n", arduinopos);
      */
      // find the latest packet, delimited by
      char rightedge = '\n';
      char leftedge = '\n';
      // get right edge
      int re = -1;
      for(int i=arduinopos-1; i>=0; i--)
        if(arduinodata[i] == rightedge){
          re = i;
          break;
        }
      if(re == -1)
        for(int i=arduinobuflen-1; i>=arduinopos; i--)
          if(arduinodata[i] == rightedge){
            re = i;
            break;
          }
      if(re != -1){ // get left edge
        int le = -1;
        if(re != 0){
          for(int i=re-1; i>=0; i--)
            if(arduinodata[i] == leftedge){
              le = i;
              break;
            }
        }
        if(le == -1)
          for(int i=arduinobuflen-1; i>re; i--)
            if(arduinodata[i] == leftedge){
              le = i;
              break;
            }
        if(le != -1){ // assemble packet
          //printf("taking packet from %d to %d\n", le, re);
          if(le < re){
            for(int i=le; i<=re; i++)
              arduinoline[i-le] = arduinodata[i];
            arduinoline[re-le] = 0;
          }
          else{
            for(int i=le+1; i<arduinobuflen; i++)
              arduinoline[i-le] = arduinodata[i];
            for(int i=0; i<re; i++)
              arduinoline[arduinobuflen-le+i] = arduinodata[i];
            arduinoline[arduinobuflen-(re-le)] = 0;
          }
          //printf("Arduino line: %s\n",arduinoline);
        }
      }
      for(int i=0; i<7; i++){
        number0s[i] = arduinoline[i+1];
        number1s[i] = arduinoline[i+9];
      }
      number0s[7] = '\0';
      number1s[7] = '\0';
      //printf("number strings are: %s,%s\n",number0s,number1s);
      number0 = atoi(number0s);
      number1 = atoi(number1s);
      //printf("numbers are: %d,%d\n",number0,number1);
    }
    // simulation
    newtime = SDL_GetTicks();
    float elapsedtime = (newtime - oldtime)/1000.f;
    oldtime = newtime;

    paddle0pos += elapsedtime * paddle0input;
    paddle1pos += elapsedtime * paddle1input;

    if(have_arduino){
      paddle0pos = (2.-paddleh/2)*(number0/1024.-.5);
      paddle1pos = (2.-paddleh/2)*(number1/1024.-.5);
      //printf("paddle positions are %f,%f\n",paddle0pos,paddle1pos);
    }

    ballpos[0] += elapsedtime * ballvel[0];
    ballpos[1] += elapsedtime * ballvel[1];

    // bounce off top and bottom
    if(ballpos[1] + ballrad > 1){
      ballpos[1] = (1-ballrad)-(1-(ballpos[1]+ballrad));
      ballvel[1] = -fabs(ballvel[1]);
    }
    if(ballpos[1] - ballrad < -1){
      ballpos[1] = (-1+ballrad)+((ballpos[1]-ballrad)+1);
      ballvel[1] = fabs(ballvel[1]);
    }

    // bounce off sides
    if(ballpos[0] - ballrad < -1){
      if(fabs(-paddle1pos-ballpos[1]) > paddleh){
        ballpos[0] = 0;
        ballpos[1] = 0;
        ballvel[0] = 1;
        ballvel[1] = 0;
      } else {
        ballpos[0] = (-1+ballrad)+((ballpos[0]-ballrad)+1);
        ballvel[0] = fabs(ballvel[0]);
        printf("collision: ballpos, paddle1pos: (%f,%f)->%f\n",ballpos[1],paddle1pos,ballpos[1]+paddle1pos);
        ballvel[1] += ballpos[1]+paddle1pos;
      }
    }
    if(ballpos[0] + ballrad > 1){
      if(fabs(-paddle0pos-ballpos[1]) > paddleh){
        ballpos[0] =  0;
        ballpos[1] =  0;
        ballvel[0] = -1;
        ballvel[1] =  0;
      } else {
        ballpos[0] = (1-ballrad)-(1-(ballpos[0]+ballrad));
        ballvel[0] = -fabs(ballvel[0]);
        printf("collision: ballpos, paddle1pos: (%f,%f)->%f\n",ballpos[1],paddle0pos,ballpos[1]+paddle0pos);
        ballvel[1] += paddle0pos+ballpos[1];
      }
    }

    ballpos[1] += elapsedtime * ballvel[1];

    // rendering
    print_gl_error("checking for errors before rendering");
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    print_gl_error("clearing buffer");

    glUseProgram(ball_shader_program);
    print_gl_error("setting shader program for ball");
    u_view[3*4+0] = -ballpos[0];
    u_view[3*4+1] = -ballpos[1];
    glUniformMatrix4fv(ball_u_viewLoc,1,GL_FALSE,&u_view);
    print_gl_error("setting view matrix for ball");
    glBindVertexArray(ball_vao);
    print_gl_error("setting vertex array for ball");
    glDrawArrays(GL_TRIANGLES, 0, 3*balltris);
    print_gl_error("drawing ball");

    glUseProgram(paddle_shader_program);
    u_view[3*4+0] = -.955;
    u_view[3*4+1] = paddle0pos;
    glUniformMatrix4fv(paddle_u_viewLoc,1,GL_FALSE,&u_view);
    glBindVertexArray(paddle_vao);
    glDrawArrays(GL_TRIANGLES, 0, 3*paddletris);
    u_view[3*4+0] = .955;
    u_view[3*4+1] = paddle1pos;
    glUniformMatrix4fv(paddle_u_viewLoc,1,GL_FALSE,&u_view);
    glDrawArrays(GL_TRIANGLES, 0, 3*paddletris);
    //printf("fps: %f; pos: (%f,%f); vel: (%f,%f)\n", 1/elapsedtime, ballpos[0], ballpos[1], ballvel[0], ballvel[1]);


    SDL_GL_SwapWindow(window);
  }


  quit(0);
}
