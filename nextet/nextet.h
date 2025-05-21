#define BOARD_W 12
#define BOARD_H 21

#define SHAPE_I 0x10
#define SHAPE_O 0x20
#define SHAPE_S 0x30
#define SHAPE_Z 0x40
#define SHAPE_T 0x50
#define SHAPE_J 0x60
#define SHAPE_L 0x70

#define STATE_EMPTY 0
#define STATE_FALLING 1
#define STATE_DOWN 2
#define STATE_WALL 3

#define MASKSHAPE 0xF0
#define MASKSTATE 0x0F

#define I_LEFT 1
#define I_RIGHT 2
#define I_DOWN 3
#define I_DROP 4
#define I_CCW 5
#define I_RG 6
#define I_PAUSE 7
#define I_ENDGAME 8

#define ACCELBY_DROPS 0
#define ACCELBY_LINES 1
#define ACCELBY_SCORE 2

/* a square is */
unsigned char board[BOARD_H][BOARD_W];
unsigned char next[5][5];

int score, lines, drops, accelby, drawticklen, dropticklen;
double basedroptime, acceleration;
char done, stopped, paused;

void nt_pause(void);
/* an IO system needs to implement main(), and at some point call this */
void play_tetris(void);

/* functions a platform io system needs to have */
void draw(void);
void drawnext(void);
void drawscores(void);
int getinput(int until);
int gettime(void);
