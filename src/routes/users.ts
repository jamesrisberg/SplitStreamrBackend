/// <reference path="../../typings/main.d.ts"/>

import express = require('express');
import User = require('../models/user');
import IUser = require('../interfaces/user');
import passport = require('passport');

let LocalStrategy = require('passport-local').Strategy;

// Serialize session
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// Deserialize sessions
passport.deserializeUser(function(id, done) {
    User.findOne({
        _id: id
    }, '-salt -password', function(err, user) {
        done(err, user);
    });
});

// Set up local strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function(username, password, done) {
    User.findOne({
        email: username
    }, function(err, user) {
        if (err) {
            return done(err);
        } else if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        } else if (!user.authenticate(password)) {
            return done(null, false, { message: 'Invalid email or password' });
        } else {
            return done(null, user);
        }
    });
}));

export function signIn(req: express.Request, res: express.Response) {
    let email = req.body.email.toLowerCase();

    User.findOne({ email: email }, (err, user) => {
        if (err) {
            return res.status(400).send(err);
        } else if (!user) {
            return res.status(403).send({
                message: 'Invalid email or password'
            });
        } else {
            req.login(user, err => {
                if (err)
                    res.status(400).send(err);
                else
                    res.json(user);
            });
        }
    });
}

export function signUp(req: express.Request, res: express.Response) {
    let user = new User(req.body);

    user.provider = 'local';

    user.roles = ['user'];

    user.save(err => {
        if (err) {
            return res.status(400).send(err);
        } else {
            user.password = undefined;
            user.salt = undefined;

            req.login(user, (err) => {
                if (err)
                    res.status(400).send(err);
                else
                    res.json(user);
            });
        }
    });
}
