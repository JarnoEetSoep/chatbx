const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = (req, res) => {
    let user = require('../db/users.json').filter(u => u.id == req.params.userId)[0];

    if(user) {
        res.render('user', {
            title: `User ${user.username}`,
            isAuthenticated: req.isAuthenticated()
        });
    } else {
        res.render('invalidUser', {
            invId: req.params.userId,
            isAuthenticated: req.isAuthenticated()
        });
    }
}