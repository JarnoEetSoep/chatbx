const { request, response } = require('express');
const EventEmitter = require('events').EventEmitter;

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {EventEmitter} pp2sio 
 */
exports.run = (req, res, pp2sio) => {
    req.logout();
    res.redirect('back');
    return pp2sio.emit('logout');
}