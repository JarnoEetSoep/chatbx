const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = async (req, res) => {
    res.render('register', {
        title: 'register',
        isAuthenticated: req.isAuthenticated()
    });
}