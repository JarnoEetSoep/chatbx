const { request, response } = require('express');
const passport = require('passport');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {Function} next 
 * @param {passport} passport
 */
exports.run = (req, res, next, passport) => {
    passport.authenticate('local', (err, user, info) => {
        if(err) return next(err);
        if(!user) return res.redirect('/login');
        req.logIn(user, err => {
            if(err) return next(err);
            res.redirect(`/users/${require('../../db/users.json').filter(u => u.username == req.body.username)[0].id}`);
        });
    })(req, res, next);
};