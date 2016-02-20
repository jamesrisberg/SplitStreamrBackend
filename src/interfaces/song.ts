/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');

interface ISong extends mongoose.Document {
    name: String; // Name of song
    artist: String; // Name of artist
    length: Number; // Length in Seconds
    numberOfChunks: Number; // Total number of chunks to split file into
    fixedChunkSize: Number; // Size in bytes
    fileType: String; // File extension, eg 'mp3'
}
