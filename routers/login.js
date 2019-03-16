const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = (req, res) => {
    res.render('login', {
        title: 'login',
        isAuthenticated: req.isAuthenticated()
    });
}