/// <reference path="../typings/main.d.ts"/>

import express = require('express');
import ws = require('ws');
import mongoose = require('mongoose');
import http = require('http');
import path = require('path');
import songRoutes = require('./routes/songs');
import WebSocketHandler = require('./controllers/websocket');
import songController = require('./controllers/song');

var WebSocketServer = ws.Server;
var app = express();
var server: http.Server = http.createServer(app);
var wss: ws.Server = new WebSocketServer({server: server});
var WebSocketHander = new WebSocketHandler(wss);
var publicDir = path.resolve('public');

mongoose.connect('mongodb://localhost/splitstreamr-test');

app.route('/songs')
    .get(songRoutes.getSongs);

app.route('/songs/:songID')
    .get(songRoutes.songByID);

app.get("/", (req, res) => {
    res.sendFile(path.resolve('index.html'));
});

app.use(express.static(publicDir));

songController.populateSongs();

server.listen(8080);
