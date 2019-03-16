const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {Function} next 
 */
exports.run = (req, res, next, ioSrv) => {
    if(req.params.APIpath == 'login') return require('./api/login')(req, res);
    if(req.params.APIpath == 'sendMessage') return require('./api/sendMessage')(req, res, ioSrv);
}