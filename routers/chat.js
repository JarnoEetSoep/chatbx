const chats = require('../db/chats.json');

exports = module.exports = {};

exports.run = (req, res) => {
    if(chats.filter(chat => chat.path == req.params.chatId).length == 0) {
        res.render('invalidChat', {
            invId: req.params.chatId
        });
    } else {
        res.render("chat", {
            chatId: req.params.chatId,
            title: chats.filter(chat => chat.path == req.params.chatId)[0].name
        });
    }
}