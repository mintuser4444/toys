import mutex
from random import randint

#constants
points = {"place": 5,
          "drop": 2,
          "down": 1,
          "line": 50,
          "double": 150,
          "triple": 300,
          "tetris": 500}

#these lists are piece definitions.  They give coordinates of
#each square of the tetromino in each rotation.
shape_names = ["I","O","S","Z","T","L","J"]
shapes = [[2,0,2,1,2,2,2,3, 0,1,1,1,2,1,3,1, 1,0,1,1,1,2,1,3, 0,2,1,2,2,2,3,2],
          [1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1],
          [1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1, 1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1],
          [2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1, 2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1],
          [0,1,1,1,2,1,1,2, 1,0,1,1,2,1,1,2, 1,0,0,1,1,1,2,1, 1,0,0,1,1,1,1,2],
          [0,1,1,1,2,1,0,2, 1,0,1,1,1,2,2,2, 2,0,0,1,1,1,2,1, 0,0,1,0,1,1,1,2],
          [0,0,0,1,1,1,2,1, 1,0,1,1,0,2,1,2, 0,1,1,1,2,1,2,2, 1,0,2,0,1,1,1,2]]


attrs = ["paused", "done", "ticklen", "score", "lines", "singles", "doubles", "triples", "tetrises", "drops"]
attrs.extend(shape_names)


#classes
class Board(list):
    def __init__(self, displayframe, player):
        self.displayframe = displayframe 
        self.player = player
        #initialize the board
        #!!the board is accessed (y,x)
        self.width = player.board_width + 2
        self.height = player.board_height + 1
        for i in xrange(0, self.height):
            self.append(list())
            for j in xrange(0, self.width):
                self[i].append("empty")
        for i in xrange(0, self.height):
            self[i][0] = "wall"
            self[i][self.width-1] = "wall"
        for i in xrange(0, self.width):
            self[self.height-1][i] = "wall"
        self.next_board = []
        for i in xrange(0,5):
            self.next_board.append(list())
            for j in xrange(0,5):
                self.next_board[i].append("empty")
        #it will be accessed asynchronously, so it needs a mutex
        self.bmutex = mutex.mutex()
        #set some variables up
        self.draw = displayframe.draw
        self.transfer = displayframe.transfer
        self.ignore_next_tick = False
        self.next_tick = 0
        self.nextshape = randint(0,6)
        self.nextrot = randint(0,3)
        #attrs
        self.done = False
        self.paused = True
        for attr in attrs[3:]:
            self.__dict__[attr] = 0
        self.updateticklen()


    def __str__(self):
        s = ""
        for i in xrange(0, self.height):
            for j in xrange(0, self.width):
                if self[i][j] == "wall":
                    s += "#"
                elif self[i][j] == "down":
                    s += "O"
                elif self[i][j] == "falling":
                    s += "F"
                elif self[i][j] == "empty":
                    s += " "
            s += '\n'
        return s

    def attrs(self):
        s = ""
        for attr in attrs:
            s += "%s: %s\n"%(attr,self.__dict__[attr])
        return s

    def attrup(self, attr, up=1):
        if not self.done:
            self.__dict__[attr] += up
        
    def next(self):
        #generate the next piece
        self.x = 4
        self.y = 0
        self.shape = self.nextshape
        self.rot = self.nextrot
        self.attrup(shape_names[self.shape], 1)
        self.nextshape = randint(0,6)
        self.nextrot = randint(0,3)
        #see if the player has any lines
        lines = 0
        for j in xrange(0, self.height-1):
            for i in xrange(1, self.width-1):
                if self[j][i] != "down":
                    break
            else:
                self.remline(j)
                lines += 1
        if lines == 0:
            pass
        elif lines == 1:
            self.attrup("score", points["line"])
            self.attrup("singles")
        elif lines == 2:
            self.attrup("score", points["double"])
            self.attrup("doubles")
            self.displayframe.pushlines(1)
        elif lines == 3:
            self.attrup("score", points["triple"])
            self.attrup("triples")
            self.displayframe.pushlines(2)
        elif lines == 4:
            self.attrup("score", points["tetris"])
            self.attrup("tetrises")
            self.displayframe.pushlines(4)
        #accelerate the dropping- DOES NOT BELONG HERE
        self.updateticklen()
        #see if the new piece will fit, or if its game over
        if self.bump():
            self.done = True
            self.displayframe.transfer("attrs")
        self.plotshape()
        self.plotnext()
        self.draw()

    def remline(self, line):
        del self[line]
        newline = []
        newline.append("wall")
        for i in xrange(1, self.width-1):
            newline.append("empty")
        newline.append("wall")
        self.insert(0, newline)
        self.attrup("lines", 1)
        # remline() doesn't need to call self.draw() because it's only
        # called from next(), right before next() calls self.draw()

    def putlines(self, lines):
        self.bmutex.lock(self.do_putlines, lines)
        
    def do_putlines(self, lines):
        try:
            self.plotshape("empty")
            lines_added = 0
            while lines_added < lines:
                newline = []
                newline.append("wall")
                for i in xrange(1,self.width-1):
                    if randint(0,10) > 2:
                        newline.append("down")
                    else:
                        newline.append("empty")
                if "empty" not in newline:
                    continue
                newline.append("wall")
                del self[0]
                self.insert(self.height-2, newline)
                lines_added += 1
            self.y = max(self.y - lines, 0)
            if self.bump():
                self.done = True
            self.plotshape("falling")
            self.draw("board")
        finally:
            self.bmutex.unlock()

    def plotshape(self, state = "falling"):
        for i in xrange(0, 8, 2):
            shape = shapes[self.shape]
            self[self.y+shape[self.rot*8+i+1]][self.x+shape[self.rot*8+i]] = state

    def plotnext(self):
        for i in xrange(0,4):
            for j in xrange(0,4):
                self.next_board[i][j] = "empty"
        for i in xrange(0,8,2):
            shape = shapes[self.nextshape]
            self.next_board[shape[self.nextrot*8+i+1]][shape[self.nextrot*8+i]] = "filled"
                
    def bump(self):
        shape = shapes[self.shape]
        for i in xrange(0,8,2):
            if self[self.y+shape[self.rot*8+i+1]][self.x+shape[self.rot*8+i]] != "empty":
                return True
        return False

    def stick(self):
        self.y -= 1
        self.plotshape("down")
        self.attrup("score", points["place"])
        self.next()
    
    def execute(self, command):
        self.bmutex.lock(self.do_execute, command)

    def do_execute(self, command):
        try:
            if self.paused:
                self.unpause()
            self.plotshape("empty")
            if command == "left":
                self.x -= 1
                if self.bump():
                    self.x += 1
                self.y += 1
                if self.bump():
                    self.ignore_next_tick = True
                self.y -= 1
            elif command == "right":
                self.x += 1
                if self.bump():
                    self.x -= 1
                self.y += 1
                if self.bump():
                    self.ignore_next_tick = True
                self.y -= 1
            elif command == "down":
                #my theory is, nobody wants to press down to stick a piece in
                #place, any time they seem like they're doing it, its a mistake
                self.y += 1
                self.attrup("score", points["down"])
                if self.bump():
                    self.y -= 1
                    self.attrup("score", -points["down"])
            elif command == "drop":
                while not self.bump():
                    self.y += 1
                    self.attrup("score", points["drop"])
                self.attrup("drops", 1)
                self.attrup("score", -points["drop"])
                self.stick()
                return
            elif command == "counterclockwise":
                self.rot = (self.rot+1)%4
                if self.bump():
                    self.rot = (self.rot-1)%4
            elif command == "retrograde":
                self.rot = (self.rot-1)%4
                if self.bump():
                    self.rot = (self.rot+1)%4
            self.plotshape()
            self.draw("board")
            self.draw("attrs")
        finally:
            self.bmutex.unlock()

    def updateticklen(self):
        if self.player.accel == "drops":
            coefficient = self.drops
        if self.player.accel == "lines":
            coeffecient = self.lines
        if self.player.accel == "score":
            coefficient = self.score
        if self.player.accel == "none":
            coefficient = 0
        self.ticklen = int(self.player.basedroptime/(coefficient*self.player.accelfactor+1))
        
    def unpause(self):
        self.paused = False
        self.displayframe.setup_tick(self)
        self.displayframe.transfer("unpause")
        self.draw("attrs")
    
    def pause(self):
        self.paused = True
        self.displayframe.transfer("pause")
        self.draw("attrs")

    def tick(self, securekey):
        if self.done or self.paused:
            return
        if securekey != self.next_tick:
            return
        try:
            if self.ignore_next_tick:
                self.ignore_next_tick = False
                return
            self.bmutex.lock(self.do_tick, None)
        finally:
            self.displayframe.setup_tick(self)


    def do_tick(self, dummy):
        try:
            self.plotshape("empty")
            self.y += 1
            if self.bump():
                self.stick()
                return
            self.plotshape("falling")
            self.draw("board")
        finally:
            self.bmutex.unlock()

    
            
    def setboard(self, ftw): #from the wire
        for j in xrange(0,self.height-1):
            for i in xrange(1,self.width-1):
                if ftw[j][i] == ' ':
                    self[j][i] = "empty"
                elif ftw[j][i] == '#':
                    self[j][i] = "wall"
                elif ftw[j][i] == 'O':
                    self[j][i] = "down"
                elif ftw[j][i] == 'F':
                    self[j][i] = "falling"
        self.draw("board")
        
