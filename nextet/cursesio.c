#include <curses.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>
#include "nextet.h"

int main(void)
{
  initscr();
  noecho();
  nonl();
  cbreak();
  nodelay(stdscr, TRUE);
  intrflush(stdscr, FALSE);
  keypad(stdscr, TRUE);
  drawticklen = 65535;
  basedroptime = 5;
  acceleration = .002;
  srand(time(NULL));
  play_tetris();
  return 0;
}

int gettime(void)
{
  struct timeval t;

  gettimeofday(&t, NULL);
  return (t.tv_sec * 1000000 + t.tv_usec)/100000;
}

void draw(void)
{
  char buf[22];
  clear();
  int i,j;
  for(i=0; i!=BOARD_H; i++)
    for(j=0; j!=BOARD_W; j++)
      switch(board[i][j]&MASKSTATE){
      case STATE_EMPTY:
	break;
      case STATE_FALLING:
      case STATE_DOWN:
	mvaddch(i, j, 'O');
	break;
      case STATE_WALL:
	mvaddch(i, j, 'X');
	break;
      default:
	break;
      }
  for(i=0; i!=4; i++)
    for(j=0; j!=4; j++){
      if((next[i][j]&MASKSTATE) != STATE_EMPTY)
	mvaddch(i+1, j+BOARD_W+1, 'O');
      else
	mvaddch(i+1, j+BOARD_W+1, ' ');
    }
  snprintf(buf, 21, "Lines: %d", lines);
  mvaddstr(6, BOARD_W+1, buf);
  snprintf(buf, 21, "Score: %d", score);
  mvaddstr(7, BOARD_W+1, buf);
  snprintf(buf, 21, "Drop time: %dx10^-1s", dropticklen);
  mvaddstr(8, BOARD_W+1, buf);
  refresh();
}

void drawnext(void)
{
  draw();
}

void drawscores(void)
{
  draw();
}

int getinput(int until)
{
  int input;

  halfdelay(until);
  input = getch();
  if(input != ERR)
    switch(input){
    case KEY_LEFT:
	return I_LEFT;
    case KEY_RIGHT:
      return I_RIGHT;
      case KEY_DOWN:
	return I_DOWN;
      case ' ':
	return I_DROP;
    case 'n':
      return I_CCW;
    case 'm':
      return I_RG;
    case 'q':
      return I_ENDGAME;
    case 'p':
      return I_PAUSE;
    default:
      break;
    }
  return 0;
}
