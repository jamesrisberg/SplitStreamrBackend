/// <reference path="../../typings/main.d.ts"/>

import express = require('express');
import mongoose = require('mongoose');
import Song = require('../models/song');
import User = require('../models/user');

export function getSongs(req: express.Request, res: express.Response) {
    Song
        .find({ user: new mongoose.Types.ObjectId(req.params.userID) })
        .exec((err, songs) => {
            if (err) {
                res.status(400);
                res.jsonp(err);
            } else {
              console.log(songs);
                res.jsonp(songs);
            }
        });
}

export function songByID(req: express.Request, res: express.Response) {
    let songID: string = req.params.songID;

    Song
        .findOne({_id: songID})
        .exec((err, song) => {
            if (err) {
                res.status(400);
                res.jsonp(err);
            } else {
                res.jsonp(song);
            }
        });
}
