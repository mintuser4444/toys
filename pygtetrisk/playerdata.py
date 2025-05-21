class player_data:
    def __init__(self, name="Default",board_width = 10, board_height = 20, squaresize = 24, buttons = {'j':'left', 'l':'right', 'k':'down', 'space':'drop', 'd':'counterclockwise', 'f':'retrograde', 'p':'pause', 'r':'reset'}, basedroptime=400, accel = 'drops', accelfactor = .001, grid = True):
        global registry
        self.name = str(name)
        self.board_width = int(board_width)
        self.board_height = int(board_height)
        self.squaresize = int(squaresize)
        self.buttons = buttons
        self.basedroptime = int(basedroptime)
        self.accel = accel
        self.accelfactor = accelfactor
        self.grid = grid

    def netheaders(self):
        s = "name:%s\n"%self.name
        s += "board_width:%s\n"%self.board_width
        s += "board_height:%s\n"%self.board_height
        s += "grid:%s"%self.grid
        return s

    def set(self,dic):
        self.__dict__ = dic

    def set_and_return(self, dic):
        self.set(dic)
        return self
        
    def __str__(self):
        return str(self.__dict__)

    def __repr__(self):
        return str(self.__dict__)
