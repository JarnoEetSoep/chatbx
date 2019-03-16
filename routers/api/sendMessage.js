const users = require('../../db/users.json');
const chats = require('../../db/chats.json');
const ranks = require('../../db/ranks.json');

module.exports = (req, res, ioSrv) => {
    if(req.body.token == undefined) return res.send({ status: 0 });
    if(req.body.chatID == undefined) return res.send({ status: 0 });
    if(req.body.message == undefined) return res.send({ status: 0 });

    const user = users.filter(u => u.token == req.body.token)[0];
    if(!user) return res.send({ status: 0 });

    const chat = chats.filter(c => c.id == req.body.chatID)[0];
    if(!chat) return res.send({ status: 0 });

    const message = `${ranks[user.rank].prefix}${user.username}${ranks[user.rank].suffix}${req.body.message}`;

    ioSrv.to(chat.id).emit('othermessage', { message: message });

    res.send({
        status: 1,
        msg: message
    });
}