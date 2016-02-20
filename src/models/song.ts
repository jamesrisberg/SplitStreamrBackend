/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');
import ISong = require('../interfaces/song');
var Schema = mongoose.Schema;

var SongSchema = new Schema({
    name: String, // Name of song
    artist: String, // Name of artist
    length: Number, // Length in Seconds
    numberOfChunks: Number, // Total number of chunks to split file into
    fixedChunkSize: Number, // Size in bytes
    fileType: String // File extension, eg 'mp3'
});

export = mongoose.model<ISong>('Song', SongSchema);
