/// <reference path="../../typings/main.d.ts"/>

import fs = require('fs');
import q = require('q');
import path = require('path');
import Song = require('../models/song');
import ISong = require('../interfaces/song');
var mm = require('musicmetadata');
var readdir = q.nfbind(fs.readdir);

export function getMusicFileMetadata(filename: string) {
    var defer = q.defer();
    var chunkSize = 128000;

    mm(fs.createReadStream(filename),
       { duration: true },
       (err, metadata) => {
           if (err) defer.reject(err);
           else {
               var song: ISong = new Song({
                   name: metadata.title,
                   artist: metadata.artist[0],
                   length: metadata.duration,
                   numberOfChunks: Math.ceil(fs.statSync(filename).size / chunkSize),
                   fixedChunkSize: chunkSize,
                   fileType: filename.split('.')[1],
                   path: filename
               });

               Song
                   .findOne({path: filename})
                   .exec((err, _song) => {
                       if (!_song) {
                           song.save((err, song) => {
                               if (err) defer.reject(err);
                               defer.resolve(song);
                           });
                       } else {
                           defer.resolve(_song);
                       }
                   });
           }
       });

    return defer.promise;
}

export function populateSongs() {
    var songDir = path.resolve(__dirname, '../../songs/');

    readdir(songDir).then((files: string[]) => {
        var metaDataPromises: Q.IPromise<any>[] = files.map((file) => {
            return getMusicFileMetadata(path.join(songDir, file));
        });

        return q.all(metaDataPromises);
    }).then((metadata) => {
        console.log(metadata);
    })
}
