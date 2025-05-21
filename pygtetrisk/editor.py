import gtk, gtk.glade


def button_editor_button_pressed(entry, event):
    keyname = gtk.gdk.keyval_name(event.keyval)
    entry.set_text(keyname)
    return True

def numeric_validate(entry):
    try:
        float(entry.get_text())
    except ValueError:
        print "need2do sumthing about this1"
        defaultplayer = player_data()
        k = self.numeric_validation_widgets[entry]
        self.player_data.__dict__[k] = defaultplayer.__dict__[k]

class editor:
    def __init__(self, player_data, return_player_data, mode="new"):
        self.player_data = player_data
        self.return_player_data = return_player_data

        dic = {'button_editor_button_pressed': button_editor_button_pressed,
               'stop_editing': self.stop_editing,
               'return_data': self.return_data}
        self.gui = gtk.glade.XML('glade/playereditor.glade')
        self.gui.signal_autoconnect(dic)
        self.numeric_validation_widgets = {self.gui.get_widget("width_entry"): "board_width",self.gui.get_widget("height_entry"):"board_height", self.gui.get_widget("basedroptime_entry"):"basedroptime", self.gui.get_widget("accelfactor_entry"): "accelfactor"}
        self.acceltypes = ["drops", "lines", "score", "none"]
        leader = self.gui.get_widget("drops_button")
        for acceltype in self.acceltypes[1:]:
            self.gui.get_widget(acceltype+"_button").set_group(leader)
        self.keycommands = ['left', 'right', 'down', 'drop', 'counterclockwise', 'retrograde', 'pause', 'reset']
        self.populate_widgets()
        self.gui.get_widget('editor_window').show_all()
        
        
    def stop_editing(self, lol=None):
        self.gui.get_widget('editor_window').destroy()

    def populate_widgets(self):
        self.gui.get_widget("name_entry").set_text(self.player_data.name)
        rvdic = {}
        for k,v in self.player_data.buttons.items():
            rvdic[v] = k
        for command in self.keycommands:
            self.gui.get_widget(command+'_entry').set_text(rvdic[command])
        self.gui.get_widget('height_entry').set_text(str(self.player_data.board_height))
        self.gui.get_widget('width_entry').set_text(str(self.player_data.board_width))
        self.gui.get_widget('basedroptime_entry').set_text(str(self.player_data.basedroptime))
        self.gui.get_widget('accelfactor_entry').set_text(str(self.player_data.accelfactor))
        self.gui.get_widget(self.player_data.accel+'_button').set_active(True)
        self.gui.get_widget('grid_button').set_active(self.player_data.grid)

    def return_data(self, lol):
        for widget in self.numeric_validation_widgets:
            numeric_validate(widget)
        self.player_data.name = self.gui.get_widget('name_entry').get_text()
        self.player_data.buttons=dict()
        for command in self.keycommands:
            self.player_data.buttons[self.gui.get_widget(command+'_entry').get_text()] = command
        self.player_data.board_height = int(self.gui.get_widget('height_entry').get_text())
        self.player_data.board_width = int(self.gui.get_widget('width_entry').get_text())
        self.player_data.basedroptime = int(self.gui.get_widget('basedroptime_entry').get_text())
        self.player_data.accelfactor = float(self.gui.get_widget('accelfactor_entry').get_text())
        self.player_data.grid = self.gui.get_widget('grid_button').get_active()
        for acceltype in ['drops', 'lines', 'score', 'none']:
            if self.gui.get_widget(acceltype+"_button").get_active():
                self.player_data.accel = acceltype
                break
        self.return_player_data(self.player_data)
        self.stop_editing()
