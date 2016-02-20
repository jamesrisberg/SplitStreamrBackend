/// <reference path="../../typings/main.d.ts"/>

import fs = require('fs');
import q = require('q');
import Song = require('../models/song');
import ISong = require('../interfaces/song');
var mm = require('musicmetadata');

export function getMusicFileMetadata(filename: string) {
    var defer = q.defer();

    mm(fs.createReadStream(filename),
       { duration: true },
       (err, metadata) => {
           if (err) defer.reject(err);
           else {
               var song: ISong = new Song({
                   title: metadata.title,
                   artist: metadata.artist[0],
                   length: metadata.duration,
                   numberOfChunks: fs.statSync(filename).size/1000,
                   fixedChunkSize: 1000,
                   fileType: filename.split('.')[1]
               });

               song.save((err, song) => {
                   if (err) defer.reject(err);
                   defer.resolve(song);
               })
           }
       });
}
