import socket

class net:
    def __init__(self, options, setiocallback, newshadow, on_network_recieve, getplayerheaders, removeshadow):
        self.setiocallback = setiocallback
        self.options = options
        self.newshadow = newshadow
        self.on_network_recieve = on_network_recieve
        self.getplayerheaders = getplayerheaders
        self.removeshadow = removeshadow
        self.tcpsocks = []
        self.socketplayers = {}

        
        if options.tcp:
            self.master_tcp_sock = socket.socket(socket.AF_INET,
                                                 socket.SOCK_STREAM)
            self.master_tcp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.master_tcp_sock.bind(('',11218))
            self.master_tcp_sock.listen(1024)
            self.setiocallback(self.master_tcp_sock,
                               self.on_tcp_connection)
        if options.udp:
            self.udpsock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.udpsock.bind(('',11218))
            self.udpsock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            self.setiocallback(self.udpsock.fileno(), self.on_udp_recieve)

    def on_tcp_connection(self, whatever, lol):
        print "new tcp connection"
        socky = self.master_tcp_sock.accept()[0]
        self.tcpsocks.append(socky)
        self.setiocallback(socky, self.on_tcp_recieve)
        self.new_connection(socky)
        return True

    def recieve_headers(self, data, socky):
        headerses = []
        headers = {}
        headerses.append(headers)
        for line in data:
            if line == '':
                headers = {}
                headerses.append(headers)
            (key, value) = line.split(":")
            headers[key.strip()]=value.strip()
        for headers in headerses:
            self.newshadow(headers)
        self.socketplayers[socky] = [h["name"] for h in headerses]
        return True
            
    def on_tcp_recieve(self, socky, lol):
        print "tcp got something"
        lenheader = socky.recv(5)
        if lenheader == '':
            print "remote closed the socket"
            socketplayers = self.socketplayers[socky]
            for player in socketplayers:
                self.removeshadow(player)
            socky.close()
            self.tcpsocks.remove(socky)
            #fixme: need to clean up
            return True
        data = socky.recv(int(lenheader)).strip().split('\n')
        if data[0] == "newplayers":
            self.recieve_headers(data[1:], socky)
        else:
            self.on_network_recieve(data)
        return True
                               
    def on_udp_recieve(self, whatever, lol):
        self.on_network_recieve(self.udpsock.recvfrom(4096)[0].split('\n'))
        return True

    def connect(self, server, port):
        socky = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        socky.connect((server, port))
        self.tcpsocks.append(socky)
        self.new_connection(socky)
        self.setiocallback(socky, self.on_tcp_recieve)

    def new_connection(self, socky):
        headerses = self.getplayerheaders()
        data = 'newplayers\n'
        for headers in headerses:
            data += headers+'\n\n'
        datalen = str(len(data)) + '\n'
        while len(datalen) < 5:
            datalen = '0' + datalen
        print datalen + data
        socky.sendall(datalen+data)

    def send(self, name, contype, data):
        if self.tcpsocks:
            packet = name+'\n'+contype+'\n'+data+'\n\n'
            lenheader = str(len(packet))
            while len(lenheader) < 4:
                lenheader = '0'+lenheader
            lenheader += '\n'
            for sock in self.tcpsocks:
                sock.sendall(lenheader+packet)
        if self.options.udp:
            self.udpsock.sendto(name+'\n'+contype+'\n'+data,
                                ('<broadcast>', 11218))
        
    def quit(self):
        if self.options.tcp:
            self.master_tcp_sock.close()
        for sock in self.tcpsocks:
            sock.close()
        if self.options.udp:
            self.udpsock.close()
