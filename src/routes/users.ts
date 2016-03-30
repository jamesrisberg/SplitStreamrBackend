/// <reference path="../../typings/main.d.ts"/>

import express = require('express');
import User = require('../models/user');

export function signIn(req: express.Request, res: express.Response) {
  User
    .findOne({
      username: req.body.username
    }, (err, user) => {
      if (err) {
        return res.send(err);
      }
      if (!user) {
        return res.status(403).send({
          message: 'Invalid username or password'
        });
      }

      user.password = undefined;
      user.salt = undefined;

      res.send(user);
    });
}