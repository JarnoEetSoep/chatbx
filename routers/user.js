const { request, response } = require('express');
const { Connection } = require('mongoose');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {Connection} users
 */
exports.run = async (req, res, users) => {
    users.findOne({ userId: req.params.userId }).then(user => {
        res.render('user', {
            title: `User ${user.username}`,
            isAuthenticated: req.isAuthenticated()
        });
    }).catch(() => {
        res.render('invalidUser', {
            invId: req.params.userId,
            isAuthenticated: req.isAuthenticated()
        });
    });
}