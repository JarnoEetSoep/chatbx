const { request, response } = require('express');
const bcrypt = require('bcrypt');
const { Connection } = require('mongoose');

/**
 * @param {request} req 
 * @param {response} res 
 * @param {Function} next 
 * @param {Connection} db
 */
module.exports = async (req, res, next, db) => {
    if(!req.body.username) return res.send({ status: 0 });
    if(!req.body.password) return res.send({ status: 0 });

    const user = await db.collection('users').findOne({ username: req.body.username });
    if(!user) return res.send({ status: 0 });

    if(!bcrypt.compareSync(req.body.password, user.password)) return res.send({ status: 0 });

    const token = new db.models['tokenModel']({
        user: user.userId,
        token: generateToken(db.collection('tokens'))
    });

    db.collection('tokens').insertOne(token).then(token => {
        res.send({
            status: 1,
            token: token.token
        });
    }).catch(() => res.send(500, { status: 0 }));
}

const generateToken = (tokens) => {
    let token = '';
    do {
        token = '';
        for(let x = 0; x < 25; x++) {
            let nm;
            do {
                nm = Math.floor(Math.random() * 57) + 65;
            } while(!((64 < nm < 91) || (96 < nm < 123) || (44 < nm < 47) || nm == 95));
            token = String.fromCharCode(nm);
        }
    } while(checkToken(token, tokens) != null);

    return token;
}

const checkToken = (token, tokens) => {
    tokens.findOne({ token: token }).then(token => { return token; }).catch(() => { return null; });
}