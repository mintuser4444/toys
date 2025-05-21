#!/usr/bin/python

import gtk, gobject

boardw = 8
boardh = 8
squares = 30

window = gtk.Window(gtk.WINDOW_TOPLEVEL)
vbox = gtk.VBox()
window.add(vbox)
da = gtk.DrawingArea()
da.set_events(gtk.gdk.BUTTON_PRESS_MASK)
da.set_size_request(boardw*squares,boardh*squares)
vbox.add(da)
hbbox = gtk.HButtonBox()
vbox.add(hbbox)
setbutton = gtk.ToggleButton(label="set")
clearbutton = gtk.Button(label="clear")
passbutton = gtk.Button(label="pass")
hbbox.add(setbutton)
hbbox.add(clearbutton)
hbbox.add(passbutton)

window.connect("delete-event", gtk.main_quit)
window.show_all()

display = da.window
gc = da.window.new_gc()
cm = da.get_colormap()
white = da.window.new_gc()
white.set_foreground(cm.alloc_color(65535,65535,65535))
black = da.window.new_gc()
black.set_foreground(cm.alloc_color(0,0,0))

setnext = False

board = list()
for i in range(boardw):
    l = list()
    for j in range(boardh):
        l.append("blank")
    board.append(l)


#wood = GdkImlib.Image("wood.jpg")
#wood.render()
#da.draw_image(gc,wood,0,0,0,0,-1,-1)

def draw():
    gc.set_foreground(cm.alloc_color(32767,32767,33279))
    display.draw_rectangle(gc, True, 0,0,boardw*squares,boardh*squares)
    for x in range(boardw):
        for y in range(boardh):
            if board[x][y] == "white":
                display.draw_arc(white, True, x*squares, y*squares,
                                 squares, squares, 0,23040)
            elif board[x][y] == "black":
                display.draw_arc(black, True, x*squares, y*squares,
                                 squares, squares, 0,23040)
draw()


def odd_nxt2(x,y):
    print "verify move"
    blackount = 0
    if x>0:
        if board[x-1][y] == "black":
            blackount += 1
    if x<20:
        if board[x+1][y] == "black":
            blackount += 1
    if y>0:
        if board[x][y-1] == "black":
            blackount += 1
    if y<10:
        if board[x][y+1] == "black":
            blackount += 1
    if blackount%2==0:
        print "nope"
        return False
    print "cool"
    return True

turn = "black"
def click_handle(dummy, e):
    global setnext, clearnext, turn
    x = int(e.x/squares)
    y = int(e.y/squares)
    print x,y

    if setbutton.get_active():
        if board[x][y] == "blank":
            board[x][y] = "white"
            print "set white"
        elif board[x][y] == "white":
            board[x][y] = "black"
            print "set colored"
        elif board[x][y] == "black":
            board[x][y] = "blank"
            print "set empty"
    elif board[x][y] == "blank":
        print "trying move..."
        do_turn(x,y,turn)
    draw()


def do_turn(turnx,turny,color):
    global board, turn
    if color == "white":
        other = "black"
    else:
        other = "white"
    cleardirs = []
    for d in [(1,0), (1,1), (0,1), (-1,1),
              (-1,0), (-1,-1), (0,-1), (1,-1)]:
        x,y = turnx,turny
        possible = False
        while True:
            if x+d[0]<0 or x+d[0]>=boardw or y+d[1]<0 or y+d[1]>=boardh:
                break
            if board[x+d[0]][y+d[1]] == other:
                possible = True
                x,y=x+d[0],y+d[1]
                if x<0 or x>=boardw or y<0 or y>=boardh:
                    break
                continue
            elif board[x+d[0]][y+d[1]] == color:
                if possible:
                    cleardirs.append(d)
                break
            elif board[x+d[0]][y+d[1]] == "blank":
                break
    if len(cleardirs)==0:
        print "bad move"
        return
    board[turnx][turny]=color
    for d in cleardirs:
        x,y=turnx,turny
        while True:
            board[x][y] = color
            if board[x+d[0]][y+d[1]] == color:
                break
            x,y = x+d[0],y+d[1]
    print "ok!"
    turn = other                 

def pass_turn(dummy):
    global turn
    turn = not turn

def clear(dummy):
    global board
    board = list()
    for i in range(boardw):
        l = list()
        for j in range(boardh):
            l.append("blank")
        board.append(l)
    draw()

clearbutton.connect("clicked", clear)
passbutton.connect("clicked", pass_turn)
da.connect("button_press_event", click_handle)
gtk.main()
