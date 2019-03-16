const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = (req, res) => {
    res.render("index", { isAuthenticated: req.isAuthenticated() });
}