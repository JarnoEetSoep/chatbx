const fs = require('fs');

exports = module.exports = {};

exports.run = (req, res, next, passport, users) => {
    // username
    if(!(req.body.username.length > 1 && req.body.username.length < 21 && req.body.username.match(/^[0-9a-zA-Z_]+$/))) return next(`${data.username} cannot be used.`);
    if(users.filter(user => user.username == req.body.username).length != 0) return next(`User ${data.username} does already exist.`);
    // password
    if(!(req.body.password.length > 7 && req.body.password.length < 21 && req.body.password.match(/^[0-9a-zA-Z\(\)\[\]{}\"\':;,\.\/\?\\\|=\+-_\*&\^%\$#@!~\`<>]+$/))) return next(`Password is too short, too long or contains unusable characters.`);
    
    /* SOCKET.IO
    if(users.filter(s => s.id == socket.id).length != 0) {
        users.filter(s => s.id == socket.id)[0].name = data.username;
    } else {
        users.push({
            name: data.username,
            rank: 'user',
            id: socket.id
        });
    }

    socket.user.name = data.username;
    socket.user.rank = 'user';
    io.sockets.emit('changename', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, newname: data.username });
    */
    
    users.push({
        username: req.body.username,
        id: idgen(users),
        password: req.body.password,
        rank: 'user'
    });

    fs.writeFileSync('./db/users.json', JSON.stringify(users, null, 4));
};

const idgen = users => {
    let id = '';
    do {
        id = '';
        for(let x = 0; x < 10; x++) {
            id += `${Math.floor(Math.random() * 10)}`;
        }
    } while(users.filter(user => user.id == id).length != 0);

    return id;
}