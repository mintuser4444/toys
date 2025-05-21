#include "nextet.h"
#include <stdlib.h>

#define PLACE_POINTS 5
#define DROP_POINTS 2
#define DOWN_POINTS 1
#define LINE_POINTS 50
#define DOUBLE_POINTS 150
#define TRIPLE_POINTS 300
#define TETRIS_POINTS 500

char shapes[7][32]={
  {2,0,2,1,2,2,2,3, 0,1,1,1,2,1,3,1, 1,0,1,1,1,2,1,3, 0,2,1,2,2,2,3,2},
  {1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1},
  {1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1, 1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1},
  {2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1, 2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1},
  {0,1,1,1,2,1,1,2, 1,0,1,1,2,1,1,2, 1,0,0,1,1,1,2,1, 1,0,0,1,1,1,1,2},
  {0,1,1,1,2,1,0,2, 1,0,1,1,1,2,2,2, 2,0,0,1,1,1,2,1, 0,0,1,0,1,1,1,2},
  {0,0,0,1,1,1,2,1, 1,0,1,1,0,2,1,2, 0,1,1,1,2,1,2,2, 1,0,2,0,1,1,1,2}
};

int x, y, shape, rotation, nextshape, nextrot;
int nextdroptime, nextdrawtime, pause_droptimeleft;

void nextet(void);
void remline(int line_y);
void plotshape(int state);
void plotnext(void);
char bump(void);
void stick(void);
void execute(int input);
void play_tetris(void);

void nextet(void)
{
  int linesperpiece = 0;
  char line;
  int i,j;

  for(i=0; i<BOARD_H -1; i++){
    line = 1;
    for(j=1; j<BOARD_W-1 && line; j++)
      if((board[i][j] & MASKSTATE) != STATE_DOWN)
	line = 0;
    if(line){
      remline(i);
      linesperpiece++;
    }
  }
  switch(linesperpiece){
  case 0:
    break;
  case 1:
    score += LINE_POINTS;
    break;
  case 2:
    score += DOUBLE_POINTS;
    break;
  case 3:
    score += TRIPLE_POINTS;
    break;
  case 4:
    score += TETRIS_POINTS;;
    break;
  default:
    break;
  }
  drawscores();
  switch(accelby){
  case ACCELBY_DROPS:
    dropticklen = basedroptime / (drops*acceleration+1);
    break;
  case ACCELBY_LINES:
    dropticklen = basedroptime / (drops*acceleration+1);
    break;
  case ACCELBY_SCORE:
    dropticklen = basedroptime / (drops*acceleration+1);
    break;
  }
  x=4;
  y=0;
  rotation = nextrot;
  nextrot = rand() % 3;
  shape = nextshape;
  nextshape = rand() % 6;
  plotnext();
  drawnext();
  if(bump())
    done = 1;
  plotshape(STATE_FALLING);
  draw();
}

void remline(int line_y)
{
  int i,j;
  for(i=line_y; i!=0; i--)
    for(j=1; j!=BOARD_W-1; j++)
      board[i][j] = board[i-1][j];
  for(i=1; i!=BOARD_W-1; i++)
    board[0][i] = STATE_EMPTY;
  lines++;
  draw();
}

void plotshape(int state)
{
  int i;
  for(i=0; i<8; i+=2)
    board[y+shapes[shape][rotation*8+i+1]][x+shapes[shape][rotation*8+i]] = shape*16+state;
}

void plotnext(void)
{
  int i,j;
  for(i=0; i!=4; i++)
    for(j=0; j!=4; j++)
      next[i][j] = 0;
  for(i=0; i<8; i+=2)
    next[(int)shapes[nextshape][nextrot*8+i+1]][(int)shapes[nextshape][nextrot*8+i]] = nextshape*16+1;
  drawnext();
}

char bump(void)
{
  int i;
  for(i=0; i<8; i+=2)
    if((board[y+shapes[shape][rotation*8+i+1]][x+shapes[shape][rotation*8+i]]&MASKSTATE) != STATE_EMPTY)
      return 1;
  return 0;
}

void stick(void)
{
  if(bump()){
    y--;
    plotshape(STATE_DOWN);
    score += PLACE_POINTS;
    draw();
    nextet();
  }
}

void execute(int input)
{
  if(paused){
    nextdroptime = gettime() + pause_droptimeleft;
    paused = 0;
  }
  plotshape(STATE_EMPTY);
  switch(input){
  case I_LEFT:
    x--;
    if(bump())
      x++;
    break;
  case I_RIGHT:
    x++;
    if(bump())
      x--;
    break;
  case I_DOWN:
    y++;
    score += DOWN_POINTS;
    if(bump()){
      score -= DOWN_POINTS;
      y--;
      stick();
    }
    break;
  case I_DROP:
    while(!bump()){
      y++;
      drops++;
      score += DROP_POINTS;
    }
    stick();
    break;
  case I_CCW:
    rotation = (rotation+1)%4;
      if(bump())
	rotation = rotation-1>=0 ? rotation-1 : 3;
    break;
  case I_RG:
    rotation = rotation-1>=0 ? rotation-1 : 3;
    if(bump())
      rotation = (rotation+1)%4;
    break;
  case I_ENDGAME:
    stopped = 1;
    break;
  default: //should never be reached
    break;
  }
  plotshape(STATE_FALLING);
  draw();
}

void nt_pause(void)
{
    paused = 1;
    pause_droptimeleft = nextdroptime - gettime();
}

void play_tetris(void)
{
  int event, time;
  int i,j;

  for(i=0; i!=BOARD_H; i++)
    for(j=0; j!=BOARD_W; j++)
      board[i][j] = 0;
  for(i=0; i!=BOARD_H; i++){
    board[i][0] = STATE_WALL;
    board[i][BOARD_W-1] = STATE_WALL;
      }
  for(i=0; i!=BOARD_W; i++)
    board[BOARD_H-1][i] = STATE_WALL;
  for(i=0; i!=4; i++)
    for(j=0; j!=4; j++)
      next[i][j] = 0;
  paused = 1;
  done = 0;
  stopped = 0;
  score = lines = drops = 0;
  nextet();
  time = gettime();
  nextdroptime = time + dropticklen;
  nextdrawtime = time + drawticklen;
  do{
    event = getinput(nextdroptime<nextdrawtime?nextdroptime:nextdrawtime);
    if(event)
      execute(event);
    time = gettime();
    if(time >= nextdroptime){
      nextdroptime += dropticklen;
      if(!paused){
	plotshape(STATE_EMPTY);
	y++;
	stick();
	plotshape(STATE_FALLING);
	draw();
      }
    }
    if(time >= nextdrawtime){
      nextdrawtime += drawticklen;
      draw();
    }
  }while(!(done || stopped));
}
