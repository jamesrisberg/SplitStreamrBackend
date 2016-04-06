/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');
import crypto = require('crypto');
import IUser = require('../interfaces/user');
var Schema = mongoose.Schema;

/**
 * A Validation function for local strategy properties
 */
function validateLocalStrategyProperty(property) {
    return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy email
 */
function validateLocalStrategyEmail(email) {
    return true;
};

/**
 * User schema for proctors and students.
 */
var UserSchema = new Schema({
    firstName: {
        'type': String,
        'trim': true,
        'default': '',
        'validate': [validateLocalStrategyProperty, 'Please fill in your first name']
    },
    lastName: {
        'type': String,
        'trim': true,
        'default': '',
        'validate': [validateLocalStrategyProperty, 'Please fill in your last name']
    },
    email: {
        'type': String,
        'trim': true,
        'unique': true,
        'lowercase': true,
        'default': '',
        'validate': [validateLocalStrategyEmail, 'Not a valid email address']
    },
    password: {
        'type': String,
        'default': ''
    },
    salt: {
        'type': String
    }
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function(next) {
    if (this.password && this.isModified('password')) {
        this.salt = crypto.randomBytes(16).toString('base64');
        this.password = this.hashPassword(this.password);
    }

    next();
});

/**
 * Create instance method for hashing a password
 * @param: {String} password
 */
UserSchema.method('hashPassword', function(password: string) {
    if (this.salt && password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
    } else {
        return password;
    }
});

/**
 * Create instance method for authenticating user
 * @param: {String} password
 */
UserSchema.method('authenticate', function(password: string) {
    return this.password === this.hashPassword(password);
});

export = mongoose.model<IUser>('User', UserSchema);