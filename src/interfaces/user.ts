/// <reference path="../../typings/main.d.ts"/>

import mongoose = require('mongoose');

interface IUser extends mongoose.Document {
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
    course: {
        'type': String,
        'trim': true,
        'default': ''
    },
    roles: {
        'type': [{
            'type': String,
            'enum': ['student', 'entranceProctor', 'examProctor', 'admin']
        }],
        'default': ['student']
    },
    password: {
        'type': String,
        'default': ''
    },
    salt: {
        'type': String
    },
    provider: {
        'type': String,
        'required': 'Provider is required'
    },
    online: {
        'type': Boolean,
        'default': false
    }
}

export = IUser;