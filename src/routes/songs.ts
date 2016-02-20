/// <reference path="../../typings/main.d.ts"/>

import express = require('express');
import Song = require('../models/song');

export function getSongs(req: express.Request, res: express.Response) {
    Song
        .find({})
        .exec((err, songs) => {
            if (err) {
                res.status(400);
                res.jsonp(err);
            } else {
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
