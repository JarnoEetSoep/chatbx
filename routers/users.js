const { request, response } = require('express');
const { Collection } = require('mongoose');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {Collection} users
 */
exports.run = async (req, res, users) => {
    res.render("users", {
        title: 'Users',
        isAuthenticated: req.isAuthenticated(),
        users: await users.find({}).toArray()
    });
}