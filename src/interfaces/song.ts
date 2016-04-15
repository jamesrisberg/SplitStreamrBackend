/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');

interface ISong extends mongoose.Document {
    name: string; // Name of song
    artist: string; // Name of artist
    length: number; // Length in Seconds
    numberOfChunks: number; // Total number of chunks to split file into
    fixedChunkSize: number; // Size in bytes
    fileType: string; // File extension, eg 'mp3'
    fileSize: number;
    path: string;
    user: typeof mongoose.Schema.Types.ObjectId;
}

export = ISong;
