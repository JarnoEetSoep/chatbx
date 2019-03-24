const bcrypt = require('bcrypt');
const { request, response } = require('express');
const passport = require('passport');
const { Connection } = require('mongoose');
const models = require('../../models');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {Function} next 
 * @param {passport} passport
 * @param {Connection} db
 */
exports.run = async (req, res, next, passport, db) => {
    if(!(req.body.username.length > 1 && req.body.username.length < 21 && req.body.username.match(/^[0-9a-zA-Z_]+$/))) return next(`${data.username} cannot be used.`);

    db.collection('users').findOne({ username: req.body.username }).then(() => next(`User ${data.username} does already exist.`)).catch(() => {
        if(!(req.body.password.length > 7 && req.body.password.length < 21 && req.body.password.match(/^[0-9a-zA-Z\(\)\[\]{}\"\':;,\.\/\?\\\|=\+-_\*&\^%\$#@!~\`<>]+$/))) return next(`Password is too short, too long or contains unusable characters.`);

        newUser = new models.userModel({
            userId: idgen(db.collection('users')),
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, parseInt(process.env.saltRounds)),
            rank: 'user'
        });

        db.collection('users').insertOne(newUser).then(() => {
            require('./login').run(req, res, next, passport, db);
        }).catch(err => next(err));
    });
};

const idgen = users => {
    let id = '';
    do {
        id = '';
        for(let x = 0; x < 10; x++) {
            id += `${Math.floor(Math.random() * 10)}`;
        }
    } while(getUserById(users, id) != null);

    return id;
};

const getUserById = (users, id) => {
    users.findOne({ userId: id }, (err, user) => {
        if(err) return null;
        else return user;
    });
};