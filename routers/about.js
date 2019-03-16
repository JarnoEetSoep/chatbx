const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = (req, res) => {
    res.render("about", {
        title: 'About',
        isAuthenticated: req.isAuthenticated()
    });
}