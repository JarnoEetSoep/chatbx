const chats = require('../db/chats.json');
const { request, response } = require('express');
const { Collection } = require('mongoose');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {Collection} chats
 */
exports.run = async (req, res, chats) => {
    if(!(await chats.findOne({ path: req.params.chatId }))) {
        res.render('invalidChat', {
            invId: req.params.chatId,
            isAuthenticated: req.isAuthenticated()
        });
    } else {
        res.render('chat', {
            chatId: (await chats.findOne({ path: req.params.chatId })).chatId,
            title: (await chats.findOne({ path: req.params.chatId })).name,
            isAuthenticated: req.isAuthenticated()
        });
    }
}