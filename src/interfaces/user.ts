/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');

interface IUser extends mongoose.Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    salt: string;
    roles: string[];
    provider: string;
    authenticate: Function,
    hashPassword: Function
}

export = IUser
