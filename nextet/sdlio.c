#include <math.h>
#include <stdlib.h>
#include <stdio.h>
#include "SDL.h"
#include "KBFLite.h"
#include "nextet.h"
#include <unistd.h>

#define BLOCK_S 32
#define SIXTHPI 3.14159265358979323846/6
#define TWOTHIRDSPI 3.14159265358979323846*2/3
#define TWOPI 3.14159265358979323846*2

SDL_Surface *screen;
KBF_Font *font;
Uint32 black, white, grey;

void ioterm(void)
{
  SDL_Quit();
  exit(0);
}

void prefsel(void)
{
  SDL_Event e;
  SDL_Rect r = {0, 0, 5*BLOCK_S, BLOCK_S};

  SDL_FillRect(screen, NULL, SDL_MapRGB(screen->format, 20, 20, 20));
  r.x = BLOCK_S;
  r.y = BLOCK_S;
  SDL_FillRect(screen, &r, black);
  KBF_Write(font, screen, r.x+BLOCK_S/2, r.y, "Set keys");
  r.y += BLOCK_S*1.5;
  SDL_FillRect(screen, &r, black);
  KBF_Write(font, screen, r.x+BLOCK_S/2, r.y, "Set acceleration");
  SDL_Flip(screen);
  while(1){
    SDL_PollEvent(&e);
    if(e.type == SDL_KEYDOWN)
      break;
    else
      SDL_Delay(20);
  }
}

int main(int argc, char **argv)
{
  SDL_Event ev;

  if(SDL_Init(SDL_INIT_VIDEO) < 0)
    exit(1);
  screen = SDL_SetVideoMode((BOARD_W+5)*BLOCK_S, BOARD_H*BLOCK_S, 16, SDL_HWSURFACE|SDL_FULLSCREEN);
  black = SDL_MapRGB(screen->format,   0,   0,   0);
  white = SDL_MapRGB(screen->format, 255, 255, 255);
  grey = SDL_MapRGB(screen->format, 127, 127, 127);
  KBF_SetMode(KBF_ALPHA_FROM_RGB);
  font = KBF_LoadFont(SDL_LoadBMP("helvetica.bmp"), "helvetica.def");
  drawticklen = 100;
  basedroptime = 480;
  acceleration = .002;
  srand(SDL_GetTicks());
  while(1){
    play_tetris();
    if(done)
      do{
      SDL_WaitEvent(&ev);
      if(ev.type == SDL_KEYDOWN){
	if(ev.key.keysym.sym == SDLK_q)
	  ioterm();
	if(ev.key.keysym.sym == SDLK_s)
	  break;
	}
      }while(1);
    SDL_FillRect(screen, NULL, SDL_MapRGB(screen->format, 0, 0, 0));
  }
  return 0; //not reached
}

void draw(void)
{
  int i,j;
  Uint32 colors[4]; 
  double t;
  Uint8 rgb[3];
  SDL_Rect rect = {0, 0, BLOCK_S, BLOCK_S};
  
  t = SDL_GetTicks()/2000.0;
  for(i=1; i!=4; i++){
    for(j=0; j!=3; j++)
      rgb[j] = 127 + (Uint8)(127.0*sin(t + i*SIXTHPI + j*TWOTHIRDSPI));
    colors[i] = SDL_MapRGB(screen->format, rgb[0], rgb[1], rgb[2]);
  }
  colors[0] = SDL_MapRGB(screen->format, 0, 0, 0);
  for(i=0; i!=BOARD_H; i++){
    rect.y = i*BLOCK_S;
    for(j=0; j!=BOARD_W; j++){
      rect.x = j*BLOCK_S;
      SDL_FillRect(screen, &rect, colors[board[i][j] & MASKSTATE]);
    }
  }
  rect.x = BLOCK_S*BOARD_W+BLOCK_S/2;
  rect.y = BLOCK_S*7;
  rect.h = 8;
  rect.w = BLOCK_S*4*(1-(dropticklen/basedroptime));
  SDL_FillRect(screen, &rect, SDL_MapRGB(screen->format,
					 127+127*sin(dropticklen/basedroptime*TWOPI),
					 127+127*sin((dropticklen/basedroptime*TWOPI)+TWOTHIRDSPI),
					 127+127*sin((dropticklen/basedroptime*TWOPI)+TWOTHIRDSPI*2)
					 ));
  SDL_Flip(screen);
}

void drawnext(void)
{
  int i,j;
  SDL_Rect rect = {0, 0, BLOCK_S, BLOCK_S};

  for(i=0; i!=4; i++){
    rect.y = BLOCK_S*i + BLOCK_S/2;
    for(j=0; j!=4; j++){
      rect.x = BLOCK_S*j + BLOCK_S*BOARD_W+BLOCK_S/2;
      if(next[i][j] != 0)
	SDL_FillRect(screen, &rect, grey);
      else
	SDL_FillRect(screen, &rect, black);
    }
  }
}

void drawscores(void)
{  
  char buf[22];
  SDL_Rect rect = {BLOCK_S*BOARD_W+BLOCK_S/2, BLOCK_S*4+BLOCK_S/2, BLOCK_S*4+BLOCK_S/2, BLOCK_S*2};
  SDL_FillRect(screen, &rect, black);
  snprintf(buf, 21, "Lines: %d", lines);
  KBF_Write(font, screen, rect.x, rect.y, buf);
  snprintf(buf, 21, "Score: %d", score);
  KBF_Write(font, screen, BLOCK_S*BOARD_W+BLOCK_S/2, BLOCK_S*5+BLOCK_S/2, buf);
}

int gettime(void){
  return SDL_GetTicks();
}

int getinput(int until)
{
  SDL_Event ev;

  while(SDL_GetTicks() < until)
    if(SDL_PollEvent(&ev)){
      if(ev.type == SDL_KEYDOWN){
	switch(ev.key.keysym.sym){
	case SDLK_KP4:
	  return I_LEFT;
	  break;
	case SDLK_KP6:
	  return I_RIGHT;
	  break;
	case SDLK_KP5:
	  return I_DOWN;
	  break;
	case SDLK_SPACE:
	  return I_DROP;
	  break;
	case SDLK_m:
	  return I_RG;
	  break;
	case SDLK_n:
	  return I_CCW;
	  break;
	case SDLK_p:
	  nt_pause();
	  break;
	case SDLK_s:
	  return I_ENDGAME;
	  break;
	case SDLK_q:
	  ioterm();
	  break;
	case SDLK_EQUALS:
	  nt_pause();
	  prefsel();
	  break;
	default:
	  break;
	}
      }
    } else
      SDL_Delay(10);
  return 0;
}
