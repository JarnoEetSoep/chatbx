const { request, response } = require('express');
const ioServer = require('socket.io')();
const { Connection } = require('mongoose');

/**
 * @param {request} req 
 * @param {response} res 
 * @param {Function} next 
 * @param {ioServer} IO 
 * @param {Connection} db
 */
module.exports = async (req, res, next, IO, db) => {
    if(req.body.token == undefined) return res.send({ status: 0 });
    if(req.body.chatID == undefined) return res.send({ status: 0 });
    if(req.body.message == undefined) return res.send({ status: 0 });

    const token = await db.collection('tokens').findOne({ token: req.body.token });
    if(!token) return res.send({ status: 0 });
    const user = await db.collection('users').findOne({ userId: token.user });

    const chat = await db.collection('chats').findOne({ chatId: req.body.chatID });
    if(!chat) return res.send({ status: 0 });

    const rank = await db.collection('ranks').findOne({ name: user.rank });

    const message = `${rank.prefix}${user.username}${rank.suffix}${req.body.message}`;

    IO.to(chat.id).emit('othermessage', { message: message });

    res.send({
        status: 1,
        msg: message
    });
}