const { request, response } = require('express');
const passport = require('passport');
const { Connection } = require('mongoose');

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
    passport.authenticate('local', (err, user, info) => {
        if(err) return next(err);
        if(!user) return res.redirect('/login');
        req.logIn(user, async err => {
            if(err) return next(err);
            const DBuser = await (db.collection('users').findOne({ username: user.username }));
            res.redirect(`/users/${DBuser.userId}`);
        });
    })(req, res, next);
};