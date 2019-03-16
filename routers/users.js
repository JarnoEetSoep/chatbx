const db = {};
db.users = require('../db/users.json');
const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = (req, res) => {
    res.render("users", {
        title: 'Users',
        isAuthenticated: req.isAuthenticated(),
        users: db.users
    });
}