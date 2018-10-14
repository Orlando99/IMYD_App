var http = require('http');
var https = require('https');
var fs = require('fs');
var httpProxy = require('http-proxy');
var serveStatic = require('serve-static');
var finalhandler = require('finalhandler');
var socketIO = require('socket.io');
var WebSocket = require('ws');
var Stomp = require('stompjs');

// Serve up build folder
var serve = serveStatic('dist', { index: [ 'index.html' ] })

// Get client port, server port and server domain from (in the following order):
// 1. CMD line (ex. clientport=8080, serverport=9090, serverip=localhost)
// 2. Default values (ex. client port is 8080, server port is 9090, server domain is 'localhost')
var clientPort;
var clientIP;
var socketIP;
var socketPort;
var socketPath;
var serverPort;
var serverIP;
var serverPath;
var sslCertPath;
var sslKeyPath;
var sslCaPath;
var isSSL;
var imageServerIp;
var isProd;
var authIP;
var authPort;
var authPath;

process.argv.forEach(function (arg) {
	if (arg.indexOf('clientport=') === 0) {
		clientPort = +arg.split('=')[1];
	}
	else if (arg.indexOf('clientip=') === 0) {
		clientIP = arg.split('=')[1];
	}
	else if (arg.indexOf('serverport=') === 0) {
		serverPort = +arg.split('=')[1];
	}
	else if (arg.indexOf('serverip=') === 0) {
		serverIP = arg.split('=')[1];
	}
	else if (arg.indexOf('serverpath=') === 0) {
		serverPath = arg.split('=')[1];
	}
	else if (arg.indexOf('sslcertpath=') === 0) {
		sslCertPath = arg.split('=')[1];
	}
	else if (arg.indexOf('sslcapath=') === 0) {
		sslCaPath = arg.split('=')[1];
	}
	else if (arg.indexOf('sslkeypath=') === 0) {
		sslKeyPath = arg.split('=')[1];
	}
	else if (arg.indexOf('ssl') === 0) {
		isSSL = true;
	}
	else if (arg.indexOf('imageserverip') === 0) {
		imageServerIp = arg.split('=')[1];
	}
	else if (arg.indexOf('prod') === 0) {
		isProd = true;
	}
	else if (arg.indexOf('authip') === 0) {
		authIP = arg.split('=')[1];
	}
	else if (arg.indexOf('authport') === 0) {
		authPort = arg.split('=')[1];
	}
	else if (arg.indexOf('authpath') === 0) {
		authPath = arg.split('=')[1];
	}
	else if (arg.indexOf('socketip') === 0) {
		socketIP = arg.split('=')[1];
	}
	else if (arg.indexOf('socketport') === 0) {
		socketPort = arg.split('=')[1];
	}
	else if (arg.indexOf('socketpath') === 0) {
		socketPath = arg.split('=')[1];
	}
});

clientPort = clientPort || 8080;
socketIP = socketIP || 'localhost';
socketPath = socketPath || '';
socketPort = socketPort || 9090;
serverPort = serverPort || 8989;
serverIP = serverIP || 'localhost';
serverPath = serverPath || '';
isSSL = isSSL || clientPort === 443;
sslCertPath = sslCertPath || '/etc/ssl/imyourdoc.com/crt';
sslKeyPath = sslKeyPath || '/etc/ssl/imyourdoc.com/key';
sslCaPath = sslCaPath || '/etc/ssl/imyourdoc.com/ca';
imageServerIp = imageServerIp || 'api-qa.imyourdoc.com';
isProd = isProd || false;
authIP = authIP || 'localhost';
authPort = authPort || 8988;
authPath = authPath || '';

// Build the proxy url
var serverSockets = {};
var browserSockets = {};
var browserSocketMessageQueue = {};

// Create a proxy server with custom application logic
var proxy = httpProxy.createProxyServer({});

// Create basic HTTP server (which proxies to server if the url matches the following pattern: [/^\/api.*/])
var sslOptions = {
	key: isSSL && fs.readFileSync(sslKeyPath),
	cert: isSSL && fs.readFileSync(sslCertPath),
	ca: isSSL && fs.readFileSync(sslCaPath),
	secureOptions: require('constants').SSL_OP_NO_TLSv1
};

function serverListener(req, res) {
	// Route through proxy if url matches
	if (req.url.indexOf('/login') === 0 || req.url.indexOf('/logout') === 0 ||  req.url.indexOf('/session') === 0) {
		var secure = socketPort == 8443 || socketPort == 443;
		var http = secure ? 'https://' : 'http://';
		var proxyUrl = http + socketIP + ':' + socketPort + socketPath;
		console.log('sending request to: ' + proxyUrl);
		console.log(req.headers);
		console.log(req.url);
		proxy.web(req, res, {
			target: proxyUrl,
			headers: { host: socketIP, 'Content-Type': 'application/x-www-form-urlencoded' },
			secure: secure
		});
	}
	else {
		var done = finalhandler(req, res);
		serve(req, res, done);
	}
}
var server = isSSL ? https.createServer(sslOptions, serverListener) : http.createServer(serverListener);

function getSessionIDFromCookie(cookies) {
	if (cookies == null) {
		return '';
	}

	var found = '';
	cookies = cookies.toString().split(';');
	cookies.forEach(function (cookie) {
		var parts = cookie.trim().split('=');
		if (parts[0] === 'JSESSIONID') {
			found = parts[1];
		}
	});
	return found;
}

proxy.on('error', function (err, req, res) {
	if (err) {
		console.log(err);
	}
	res.writeHead(500);
	res.end('Ooops, something went very wrong...');
});

var browserIO = socketIO(server, { secure: isSSL });
browserIO.on('connection', function (socket) {
	console.log('a user connected');
	var sessionID = getSessionIDFromCookie(socket.request.headers.cookie);
	console.log('SESSIONID: ', sessionID);
	browserSockets[sessionID] = browserSockets[sessionID] || [];
	browserSockets[sessionID].push(socket);

	console.log('a user connected with session: ', sessionID);

	var queue = browserSocketMessageQueue[sessionID];
	if (queue && queue.length) {
		queue.forEach(function (message) {
			console.log('sending message to web client', message);
			browserSockets[sessionID].forEach(function (browserSocket) {
				browserSocket.emit('/received/message', message.body);
			});
		});
		queue.splice(0, queue.length);
	}

	socket.on('sendMessage', function (message) {
		console.log('message received from browser: ', message);
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket readyState', serverSocket.ws.readyState);
			console.log('sending message to spring-boot: ', message);
			serverSocket.send('/app/sendMessage', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for message - ', sessionID);
		}
	});

	socket.on('forwardAttachment', function (message) {
		console.log('forwardAttachment received from browser: ', message);
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket readyState', serverSocket.ws.readyState);
			console.log('sending message to spring-boot: ', message);
			serverSocket.send('/app/forwardAttachment', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for message - ', sessionID);
		}
	});

	socket.on('sendMessageStatus', function (message) {
		console.log('sendMessageStatus received from browser: ', message);
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending sendMessageStatus to spring-boot: ', message);
			serverSocket.send('/app/sendMessageStatus', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for sendMessageStatus - ', sessionID);
		}
	});

	socket.on('sendAttachment', function (message) {
		console.log('sendAttachment received from browser: ');
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending sendAttachment to spring-boot: ');
			serverSocket.send('/app/sendAttachment', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for sendAttachment - ', sessionID);
		}
	});

	socket.on('sendChatState', function (message) {
		console.log('sendChatState received from browser: ');
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending sendChatState to spring-boot: ');
			serverSocket.send('/app/sendChatState', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for sendChatState - ', sessionID);
		}
	});

	socket.on('createRoom', function (message) {
		console.log('createRoom received from browser: ');
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending createRoom to spring-boot: ');
			serverSocket.send('/app/createRoom', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for createRoom - ', sessionID);
		}
	});

	socket.on('inviteToRoom', function (message) {
		console.log('inviteToRoom received from browser: ');
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		console.log('message', message);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending inviteToRoom to spring-boot: ');
			serverSocket.send('/app/inviteToRoom', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for createRoomInvitation - ', sessionID);
		}
	});

	socket.on('joinRoom', function (message) {
		console.log('joinRoom received from browser: ');
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending joinRoom to spring-boot: ');
			serverSocket.send('/app/joinRoom', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for joinRoom - ', sessionID);
		}
	});

	socket.on('deleteFromRoom', function (message) {
		console.log('deleteFromRoom received from browser: ');
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending deleteFromRoom to spring-boot: ');
			serverSocket.send('/app/deleteFromRoom', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for deleteFromRoom - ', sessionID);
		}
	});

	socket.on('renameRoom', function (message) {
		console.log('renameRoom received from browser: ');
		console.log('serverSockets', serverSockets);
		console.log('sessionID: ', sessionID);
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && serverSocket.ws.readyState === WebSocket.OPEN) {
			console.log('server socket ready state', serverSocket.ws.readyState);
			console.log('sending renameRoom to spring-boot: ');
			serverSocket.send('/app/renameRoom', {
				Cookie: 'JSESSIONID=' + sessionID
			}, message);
		}
		else {
			console.log('ERROR: cannot find server socket for renameRoom - ', sessionID);
		}
	});

	socket.on('disconnect', function () {
		console.log('disconnecting browser socket with sessionID: ', sessionID);
		var browserSocketCollection = browserSockets[sessionID];
		if (browserSocketCollection) {
			var index = browserSocketCollection.indexOf(socket);
			if (index > -1) {
				browserSocketCollection.splice(index, 1);
			}
		}
		var serverSocket = serverSockets[sessionID];
		if (serverSocket && (!browserSocketCollection || browserSocketCollection.length === 0)) {
			console.log('disconnecting server socket with sessionID: ', sessionID);
			if (serverSocket.ws.readyState === WebSocket.OPEN) {
				serverSocket.disconnect();
			}

			delete serverSockets[sessionID];
			delete browserSockets[sessionID];
		}
	});

	// Now create server socket if it doesn't yet exist
	var serverSocket = serverSockets[sessionID];
	if (!serverSocket) {
		console.log('setting new server socket');
		var wss = socketPort == 8443 || socketPort == 443 ? 'wss://' : 'ws://';
		var wsUrl = wss + socketIP + ':' + socketPort + socketPath + '/connect/websocket';
		var wsSocket = new WebSocket(wsUrl, {
			headers: {
				Cookie: 'JSESSIONID=' + sessionID
			}
		});

		console.log('wsurl: ', wsUrl);

		serverSocket = Stomp.over(wsSocket);
		serverSockets[sessionID] = serverSocket;

		console.log('set serverSockets', serverSockets);

		wsSocket.on('close', function () {
			console.log('closing server socket for session', sessionID);

			browserSockets[sessionID].forEach(function (browserSocket) {
				browserSocket.disconnect();
			});

			delete serverSockets[sessionID];
			delete browserSockets[sessionID];
		});

		wsSocket.on('error', function (err) {
			console.log('wsSocket error: ', err);
		});

		serverSocket.connect({
			cookie: 'JSESSIONID=' + sessionID,
			session: sessionID
		}, function (frame) {
			console.log('Connected: ', frame);
			serverSocket.subscribe('/user/reply', function (message) {
				console.log('received message from spring-boot: ', message);
				var browserSocketCollection = browserSockets[sessionID];
				if (!browserSocketCollection) {
					browserSocketMessageQueue[sessionID] = browserSocketMessageQueue[sessionID] || [];
					browserSocketMessageQueue[sessionID].push(message);
				}
				else {
					console.log('sending message to web client: ', message);
					browserSocketCollection.forEach(function (browserSocket) {
						browserSocket.emit('/received/message', message.body);
					});
				}
			});
		}, function (error) {
			console.log('Errored:', error);
		});
	}
});

if(clientIP) {
    console.log('listening on port ', clientPort, ' and ip ', clientIP);
    server.listen(clientPort, clientIP);
} else {
    console.log('listening on port ', clientPort, ' on all IPs');
    server.listen(clientPort);
}