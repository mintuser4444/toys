import gtk, gtk.glade, gobject
import editor, playerdata

class launcher:
    def __init__(self, registry, players, shadows, main_go):
        self.registry = registry
        self.main_go = main_go
        self.gui = gtk.glade.XML("glade/playersel.glade")
        dic = {"new_player": self.new_player,
               "edit_player": self.edit_player,
               "start_play": self.start_play,
               "quit_already": gtk.main_quit}
        self.gui.signal_autoconnect(dic)
        self.out_treeview = self.gui.get_widget("out_treeview")
        self.playing_treeview = self.gui.get_widget("playing_treeview")
        self.shadowing_treeview = self.gui.get_widget("shadowing_treeview")
        self.out_store = gtk.ListStore(str)
        self.playing_store = gtk.ListStore(str)
        self.shadowing_store = gtk.ListStore(str)
        allplayers = registry.keys()
        outplayers = [player for player in allplayers if (player not in players) and (player not in shadows)]
        for player in outplayers:
            self.out_store.append([player])
        for player in players:
            self.playing_store.append([player])
        for player in shadows:
            self.shadowing_store.append([player])
        self.out_treeview.set_model(self.out_store)
        self.playing_treeview.set_model(self.playing_store)
        self.shadowing_treeview.set_model(self.shadowing_store)
        targets = [("text/plain", gtk.TARGET_SAME_APP, 0)]
        for treeview in [self.out_treeview, self.playing_treeview, self.shadowing_treeview]:
            treeview.insert_column_with_attributes(-1, "", gtk.CellRendererText(), text=0)

            treeview.enable_model_drag_source(gtk.gdk.BUTTON1_MASK, targets, gtk.gdk.ACTION_DEFAULT|gtk.gdk.ACTION_MOVE)
            treeview.enable_model_drag_dest(targets, gtk.gdk.ACTION_MOVE)
            treeview.connect("drag-data-get", self.drag_data_get)
            treeview.connect("drag-data-received", self.drag_data_receive)
            treeview.connect("focus-in-event", self.focus_in)
        self.current_player = None
        self.gui.get_widget("players_window").show_all()

    def focus_in(self, treeview, lol):
        selection = treeview.get_selection()
        model, iter8r = selection.get_selected()
        if iter8r:
            self.current_player = model[iter8r][0]
        

    def drag_data_get(self, treeview, context, selection, info, timestamp):
        treeselection = treeview.get_selection()
        model, iter8r = treeselection.get_selected()
        if iter8r:
            text = model[iter8r][0]
            selection.set('text/plain', 8, text)


    def drag_data_receive(self, treeview, context, x, y,
                          selection, info, timestamp):
        model = treeview.get_model()
        data = selection.data
        drop_place = treeview.get_dest_row_at_pos(x,y)
        if drop_place:
            path, position = drop_place
            iter8r = model.get_iter(path)
            if (position == gtk.TREE_VIEW_DROP_BEFORE) or (position == gtk.TREE_VIEW_DROP_INTO_OR_BEFORE):
                model.insert_before(iter8r, [data])
            else:
                model.insert_after(iter8r, [data])
        else:
            model.append([data])
        if context.action == gtk.gdk.ACTION_MOVE:
            context.finish(True, True, timestamp)

    def player_return(self, player):
        if player.name not in self.registry:
            self.out_store.append([player.name])
        self.registry[player.name] = player

    def new_player(self, lol):
        editor.editor(playerdata.player_data(), self.player_return)

    def edit_player(self, lol):
        editor.editor(self.registry[self.current_player], self.player_return)

    def start_play(self, lol):
        players = [row[0] for row in self.playing_store]
        shadows = [row[0] for row in self.shadowing_store]
        self.gui.get_widget("players_window").destroy()
        self.main_go(self.registry, players, shadows)

    

