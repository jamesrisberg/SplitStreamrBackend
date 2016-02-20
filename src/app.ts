/// <reference path="../typings/main.d.ts"/>

import express = require('express');
import ws = require('ws');
import mongoose = require('mongoose');
import http = require('http');
import songRoutes = require('./routes/songs');

var WebSocketServer = ws.Server;
var app = express();
var server = http.createServer(app);
var wss = new WebSocketServer({server: server});

server.listen(8080);
