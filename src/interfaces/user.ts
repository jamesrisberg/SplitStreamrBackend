/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');

interface IUser extends mongoose.Document {
    username: string;
    password: string;
}

export = IUser;