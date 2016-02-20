/// <reference path="../../typings/main.d.ts"/>

import express = require('express');
import Song = require('../models/song');

export function getSongs(req: express.Request, res: express.Response) {
    Song
        .find({})
        .exec(function(err, songs) {
            if (err) {
                res.status(400);
                res.jsonp(err);
            } else {
                res.jsonp(songs);
            }
        });
}

export function songByID(req: express.Request, res: express.Response) {
    Song
        .findOne({})
        .exec(function(err, song) {
            if (err) {
                res.status(400);
                res.jsonp(err);
            } else {
                res.jsonp(song);
            }
        });
}
