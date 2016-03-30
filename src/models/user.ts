/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');
import ISong = require('../interfaces/user');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: String,
    password: String
});

export = mongoose.model<IUser>('User', UserSchema);