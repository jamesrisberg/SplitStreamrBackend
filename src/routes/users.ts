/// <reference path="../../typings/main.d.ts"/>

import express = require('express');
import User = require('../models/user');

export function signIn(req: express.Request, res: express.Response) {
  let formattedEmail = req.body.email.toLowerCase();
  User
    .findOne({
      email: formattedEmail
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

export function signUp(req: express.Request, res: express.Response) {
  var user = new User(req.body);

  user.save(function(err) {
      if (err) {
          return res.send(err);
      }

      user.password = undefined;
      user.salt = undefined;

      res.send(user);
  });
}