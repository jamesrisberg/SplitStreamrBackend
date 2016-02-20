/// <reference path="../typings/main.d.ts"/>

import express = require('express');
import ws = require('ws');
import mongoose = require('mongoose');
import http = require('http');
import songRoutes = require('./routes/songs');
import WebSocketHandler = require('./controllers/websocket');

var WebSocketServer = ws.Server;
var app = express();
var server: http.Server = http.createServer(app);
var wss: ws.Server = new WebSocketServer({server: server});
var WebSocketHander = new WebSocketHandler(wss);

app.route('/songs')
    .get(songRoutes.getSongs);

server.listen(8080);
