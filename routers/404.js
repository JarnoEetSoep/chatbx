const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = (req, res) => {
    res.render("404", {
        title: '404 not found',
        isAuthenticated: req.isAuthenticated()
    });
}