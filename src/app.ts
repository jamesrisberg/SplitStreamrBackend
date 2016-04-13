/// <reference path="../typings/main.d.ts"/>

import express = require('express');
import ws = require('ws');
import mongoose = require('mongoose');
import session = require('express-session');
import http = require('http');
import path = require('path');
import passport = require('passport');
import morgan = require('morgan');
import songRoutes = require('./routes/songs');
import userRoutes = require('./routes/users');
import WebSocketHandler = require('./controllers/websocket');
import songController = require('./controllers/song');

let config = require('../config');
let WebSocketServer = ws.Server;
let app = express();
let bodyParser = require('body-parser');
let server: http.Server = http.createServer(app);
let wss: ws.Server = new WebSocketServer({server: server});
let WebSocketHander = new WebSocketHandler(wss);
let publicDir = path.resolve('public');
let MongoStore = require('connect-mongo')(session);

mongoose.connect(config.mongo_url);

// Express MongoDB session storage
app.use(session({
    saveUninitialized: true,
    resave: true,
    secret: config.sessionSecret,
    cookie: {
        maxAge: config.sessionCookie.maxAge,
        httpOnly: config.sessionCookie.httpOnly,
        secure: config.sessionCookie.secure && config.secure.ssl
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        collection: config.sessionCollection
    })
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Passport requirements
app.use(passport.initialize());
app.use(passport.session());

// Pretty logs
app.use(morgan('dev'));

app.route('/songs/user/:userID').get(songRoutes.getSongs);
app.route('/songs/id/:songID').get(songRoutes.songByID);
app.route('/user/signin').post(userRoutes.signIn);
app.route('/user/signup').post(userRoutes.signUp);

app.get("/", (req, res) => {
    res.sendFile(path.resolve('index.html'));
});

app.use(express.static(publicDir));

songController.populateSongs();

server.listen(config.port);
