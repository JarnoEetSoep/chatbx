const chats = require('../db/chats.json');
const { request, response } = require('express');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 */
exports.run = (req, res) => {
    if(chats.filter(chat => chat.path == req.params.chatId).length == 0) {
        res.render('invalidChat', {
            invId: req.params.chatId,
            isAuthenticated: req.isAuthenticated()
        });
    } else {
        res.render("chat", {
            chatId: chats.filter(chat => chat.path == req.params.chatId)[0].id,
            title: chats.filter(chat => chat.path == req.params.chatId)[0].name,
            isAuthenticated: req.isAuthenticated()
        });
    }
}