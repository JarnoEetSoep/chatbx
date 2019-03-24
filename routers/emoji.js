const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = async (req, res) => {
    res.render('emoji', {
        title: 'Emoji list',
        isAuthenticated: req.isAuthenticated(),
        categories: ['People1', 'People2', 'People3', 'People4', 'Flags', 'Symbols', 'Activity', 'Objects', 'Travel', 'Nature', 'Food', 'Regional', 'Modifier']
    });
}