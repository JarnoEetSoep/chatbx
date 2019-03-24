const expressApp = require('express')();
const socketIOserver = require('socket.io')();
const { Connection } = require('mongoose');

/**
 * @param {expressApp} expressApp 
 * @param {socketIOserver} socketIOserver 
 * @param {Connection} db
 */
module.exports = (expressApp, socketIOserver, db) => {
    expressApp.post('/api/login', (req, res, next) => { return require('./api/login')(req, res, next, db) });
    expressApp.post('/api/sendMessage', (req, res, next) => { return require('./api/login')(req, res, next, socketIOserver, db) });
}