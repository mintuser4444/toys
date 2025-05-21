import gtk

class console:
    def __init__(self, main_vbox, relinquish_focus, on_exec, chat, connect):
        self.on_exec = on_exec
        self.relinquish_focus = relinquish_focus
        self.chat = chat
        self.connect = connect
        self.vbox = gtk.VBox()
        main_vbox.add(self.vbox)
        self.textview = gtk.TextView()
        self.showing_textview = False
        self.textbuffer = gtk.TextBuffer()
        self.textview.set_buffer(self.textbuffer)
        self.textview.set_editable(False)
	self.textview.connect("focus-in-event", lambda x,y: relinquish_focus())
        self.textview.set_wrap_mode(gtk.WRAP_WORD)
        self.scrollwin = gtk.ScrolledWindow()
	self.scrollwin.set_policy(gtk.POLICY_NEVER, gtk.POLICY_AUTOMATIC)
	self.scrollwin.add(self.textview)
        self.textentry = gtk.Entry()
        self.textentry.connect("key-press-event", self.textentry_keypress)

    def getcommand(self):
        self.vbox.hide_all()
        self.vbox.pack_end(self.textentry)
        self.vbox.show_all()
        self.textentry.grab_focus()
        

    def textentry_keypress(self, foo, event):
        if gtk.gdk.keyval_name(event.keyval) == "Return":
            command = self.textentry.get_text()
            self.textentry.set_text("")
            self.vbox.hide_all()
            self.vbox.remove(self.textentry)
            self.vbox.show_all()
            self.relinquish_focus()
            self.docommand(command)
            return False
        else:
            return False


    def docommand(self, command):
        clist = command.split(' ', 1)
        if clist[0] == '/exec':
            self.on_exec(clist[1])
        if clist[0] == '/connect':
            self.connect(clist[1])
        if clist[0] == '/hide':
            if self.showing_textview == True:
                self.vbox.hide_all()
                self.vbox.remove(self.scrollwin)
                self.vbox.show_all()
                self.showing_textview = False
        else:
            self.chat(command)

    def out(self, text):
        if self.showing_textview == False:
            self.vbox.hide_all()
            self.vbox.pack_start(self.scrollwin)
            self.vbox.show_all()
            self.showing_textview = True
        end = self.textbuffer.get_end_iter()
        self.textbuffer.insert(end, '\n'+text)
	self.textview.scroll_mark_onscreen(self.textbuffer.get_insert())
