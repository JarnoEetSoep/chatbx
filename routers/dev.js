const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = async (req, res) => {
    if(req.params.devPath == 'home') return res.render("dev/home", { isAuthenticated: req.isAuthenticated() });

    res.render('dev/error', { err: 'Not a valid path' });
}