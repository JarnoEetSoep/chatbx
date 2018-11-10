const express = require('express');
const app = express();
let chats = require('./db/db/chats.json');
let users = require('./db/users.json');
const fs = require('fs');

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => require('./routers/index').run(req, res));
app.get('/chats/:chatId', (req, res) => require('./routers/chat').run(req, res));
app.get('/emoji(list)?', (req, res) => require('./routers/emoji').run(req, res));
app.get('/chats', (req, res) => require('./routers/chats').run(req, res));
app.get('/about', (req, res) => require('./routers/about').run(req, res));
//app.get('/login', (req, res) => require('./routers/login').run(req, res));

server = app.listen(process.env.PORT || 80, "0.0.0.0", () => console.log(`Connected on ${server.address().address}:${server.address().port}`));

const io = require('socket.io')(server);

function getSockets(room) {
    return Object.entries(io.sockets.adapter.rooms[room] === undefined ?
    {} : io.sockets.adapter.rooms[room].sockets )
        .filter(([id, status]) => status)
        .map(([id]) => io.sockets.connected[id])
}

let names = [];

io.on('connection', socket => {
    console.log(`New user connected from ${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`);
    socket.username = 'Guest';
    socket.realUsername = "Guest";
    socket.on('join', data => {
        names.push({ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, username: socket.username, id: socket.id});
        socket.join(data.chatId);
        socket.chatId = data.chatId;
        let a = 0;
        let ips = [];
        getSockets(socket.chatId).forEach(sock => {
            a++;
            ips.push({ip: `${sock.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, username: sock.username});
        });
        socket.emit('initialize', { amount: a, usernames: ips });
        socket.broadcast.to(socket.chatId).emit('chatter_joined', { username: socket.username, ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}` });
    });
    /*socket.on('change_username', data => {
        names.filter(s => s.id == socket.id)[0].username = data.username;
        socket.username = data.username;
        io.sockets.emit('changename', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, newname: data.username });
    });*/
    socket.on('message', data => {
        if(!users[socket.realUsername].permissions.includes('sendMessages')) return socket.emit('message', { message: "[Bx] You are not allowed to send messages", username: "" })
        if(data.message.toLowerCase().startsWith('!') && users[socket.realUsername].permissions.includes('commands')) {
            if(data.message.toLowerCase().startsWith('!help')) {
                socket.emit('message', { message: '[Bx]: Help message<br>[Bx]: Commands:<br>[Bx]:     !help<br>[Bx]:     !whisper &lt;chatter&gt; &lt;message&gt;<br>[Bx]:     !logout [chatter*]<br>[Bx]:     !mute <chatter>*<br><br>Commands and parameters with an asterisk, are Admin-only', username: "" });
            } else if(data.message.toLowerCase().startsWith('!whisper')) {
                if(data.message.split(" ").length < 3) return socket.emit('message', { message: `[Bx]: You have to enter all parameters`, username: "" });
                if(names.filter(n => n.username == data.message.split(" ")[1]).length != 0) {
                    io.to(names.filter(n => n.username == data.message.split(" ")[1])[0].id).emit('othermessage', { message: `<i>${data.message.split(" ")[2]}</i>`, username: `[${socket.username}] whispers` });
                    socket.emit('message', { message: `You whispered <i>${data.message.split(" ")[2]}</i> to '${data.message.split(" ")[1]}'`, username: "" });
                } else {
                    socket.emit('message', { message: `[Bx]: '${data.message.split(" ")[1]}' is not online`, username: "" });
                }
            } else if(data.message.toLowerCase().startsWith('!logout')) {
                if(data.message.split(" ").length == 1) {
                    names.filter(s => s.id == socket.id)[0].username = "Guest";
                    socket.username = "Guest";
                    socket.realUsername = "Guest";
                    io.sockets.emit('changename', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, newname: "Guest" });
                    socket.emit('message', { message: '[Bx] successfully logged out!', username: '' });
                } else {
                    if(!users[socket.realUsername].permissions.includes('logoutOthers')) return socket.emit('message', { message: '[Bx] You have not enough permissions to do this', username: '' });
                    if(data.message.split(" ").length < 2) return socket.emit('message', { message: `[Bx]: You have to enter all parameters`, username: "" });
                    if(!names.filter(n => n.username == data.message.split(" ")[1]).length != 0) return socket.emit('message', { message: `[Bx]: '${data.message.split(" ")[1]}' is not online`, username: '' });
                    let skt = getSockets(names.filter(s => s.id == names.filter(n => n.username == data.message.split(" ")[1])[0].id)[0].id)[0];
                    names.filter(s => s.id == skt.id)[0].username = "Guest";
                    skt.username = "Guest";
                    skt.realUsername = "Guest";
                    io.sockets.emit('changename', { ip: `${skt.request.connection.remoteAddress}:${skt.request.connection.remotePort}`, newname: "Guest" });
                    socket.emit('message', { message: `[Bx] successfully logged out ${data.message.split(" ")[1]}!`, username: '' });
                }
            } else if(data.message.toLowerCase().startsWith('!mute')) {
                if(!users[socket.realUsername].permissions.includes('mute')) return socket.emit('message', { message: '[Bx] You are not allowed to mute people', username: '' })
                if(data.message.split(" ").length < 2) return socket.emit('message', { message: `[Bx]: You have to enter all parameters`, username: "" });
                if(names.filter(n => n.username == data.message.split(" ")[1]).length != 0) {
                    if(!names.filter(n => n.username == data.message.split(" ")[1]).length != 0) return socket.emit('message', { message: `[Bx]: '${data.message.split(" ")[1]}' is not online`, username: '' });
                    let skt = getSockets(names.filter(s => s.id == names.filter(n => n.username == data.message.split(" ")[1])[0].id)[0].id)[0];
                    names.filter(s => s.id == skt.id)[0].username = "Muted";
                    skt.username = "Muted";
                    skt.realUsername = "Muted";
                    io.sockets.emit('changename', { ip: `${skt.request.connection.remoteAddress}:${skt.request.connection.remotePort}`, newname: "Guest" });
                    socket.emit('message', { message: `[Bx] successfully muted ${data.message.split(" ")[1]}!`, username: '' });
                } else {
                    socket.emit('message', { message: `[Bx]: '${data.message.split(" ")[1]}' is not online`, username: "" });
                }
            } else {
                socket.emit('message', { message: `[Bx]: '${data.message.split(" ")[0].slice(1)}' is an invalid command`, username: "" });
            }
        } else {
            msg = messageParser(data.message, users[socket.realUsername].permissions);
            socket.broadcast.to(socket.chatId).emit('othermessage', {message: msg, username: socket.username});
            socket.emit('message', {message: msg, username: socket.username});
        }
    });
    socket.on('typing', () => {
        socket.broadcast.to(socket.chatId).emit('typing', { username: socket.realUsername });
    });
    socket.on('disconnect', () => {
        io.sockets.in(socket.chatId).emit('chatter_left', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}` });
    });
    socket.on('getChats', () => {
        cts = (users[socket.realUsername].permissions.includes('seeAllChats')) ? chats : chats.filter(c => c.type == 'public');
        socket.emit('giveChats', { chats: cts });
    });
    socket.on('register', data => {
        // username
        if(!(data.username.length > 1 && data.username.length < 21 && data.username.match(/^[0-9a-zA-Z_]+$/))) return socket.emit('regError', `${data.username} cannot be used.`);
        if(users[data.username]) return socket.emit('regError', `User ${data.username} does already exist.`);
        // password
        if(!(data.password.length > 7 && data.password.length < 21 && data.password.match(/^[0-9a-zA-Z\(\)\[\]{}\"\':;,\.\/\?\\\|=\+-_\*&\^%\$#@!~\`<>]+$/))) return socket.emit('regError', `Password is not strong enough / contains unusable characters.`);
        socket.emit('logged-in', { username: data.username });
        if(names.filter(s => s.id == socket.id).length != 0) {
            names.filter(s => s.id == socket.id)[0].username = data.username
        } else {
            names.push({ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, username: data.username, id: socket.id});
        }
        socket.username = data.username;
        socket.realUsername = data.username;
        io.sockets.emit('changename', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, newname: data.username });
        users[data.username] = {
            display: data.username,
            inList: true,
            password: data.password,
            permissions: [
                "sendMessages",
                "getMessages",
                "commands",
                "createChats"
            ]
        };
        fs.writeFileSync('./db/users.json', JSON.stringify(users,null,4));
        users = require('./db/users.json');
    });
    socket.on('login', data => {
        // username
        if(!users[data.username]) return socket.emit('loginError', `Username or password is incorrect.`);
        // password
        if(users[data.username].password != data.password) return socket.emit('loginError', `Username or password is incorrect.`);
        socket.emit('logged-in', { username: data.username, perms: users[data.username].permissions });
        //if(users[data.username].inList) {
            if(names.filter(s => s.id == socket.id).length != 0) {
                names.filter(s => s.id == socket.id)[0].username = data.username
            } else {
                names.push({ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, username: data.username, id: socket.id});
            }
        //}
        socket.username = users[data.username].display;
        socket.realUsername = data.username;
        io.sockets.emit('changename', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`, newname: users[data.username].display });
    });
    socket.on('newChat', data => {
        if(!users[socket.realUsername].permissions.includes("createChats")) return;
        let chatId = '0';
        while(chats.filter(c => c.id == chatId).length != 0) {
            let chars = [];
            for(var x = 0; x < 10; x++) {
                chars.push(Math.floor(Math.random() * 10));
            }
            chatId = chars.join('');
        }
        let pathName = (users[socket.realUsername].permissions.includes('createChatByName')) ? (data.nameAsPath) ? data.name : chatId : chatId;
        if(chats.filter(c => c.path == pathName).length != 0) return socket.emit('createChatError', `Chat with path /chats/${pathName} does already exist`);
        chats.push({
            name: data.name,
            id: chatId,
            path: pathName,
            type: (data.visible) ? 'public' : 'private'
        });
        fs.writeFileSync('./db/chats.json', JSON.stringify(chats,null,4));
        chats = require('./db/chats.json');
        socket.emit('redirect', { url: `/chats/${pathName}` });
    });
});

function messageParser(msg, perms) {
    let res = ` ${msg} `;
    // special chars
    res = res.replace(/&/g,"&amp;");
    res = res.replace(/</g,"&lt;");
    res = res.replace(/>/g,"&gt;");
    res = res.replace(/"/g,"&#34;");
    res = res.replace(/'/g,"&#39;");
    // markdown hyperlinks: [google](https://www.google.com) => <a href="https://www.google.com">google</a>
    res = res.replace(/\[(.*?)\]\((https?:\/\/\w*\.\w*\.?[^\s]*)\)/g, '<a href="$2">$1</a>');
    // just a normal link: https://www.google.com => <a href="https://www.google.com">https://www.google.com</a>
    res = res.replace(/([\s](https?:\/\/\w*\.\w*\.?[^\s]*)[\s])/g, url => {
        let re = ` <a href="${url.trim()}">${url.trim()}</a> `;
        if(url.trim().match(/(.jpg|.png|.jpeg|.gif|.tiff)$/) && perms.includes('sendImages')) re += `\n<img src="${url.trim()}"></img>`
        return re;
    });
    // markdown layout __, _, **, *
    res = res.replace(/__(\S+)__/g, '<b>$1</b>');
    res = res.replace(/\*\*(\S+)\*\*/g, '<b>$1</b>');
    res = res.replace(/_(\S+)_/g, '<i>$1</i>');
    res = res.replace(/\*(\S+)\*/g, '<i>$1</i>');
    // emoji
    res = res.replace(/:joy:/g, '😂');
    res = res.replace(/(:poop:|:shit:)/g, '💩');
    res = res.replace(/(:cry:|:sob:)/g, '😭');
    res = res.replace(/(:angry:|:rage:)/g, '😡');
    res = res.replace(/:middlefinger:/g, '🖕');
    res = res.replace(/:swear:/g, '🤬');
    res = res.replace(/:skull:/g, '💀');
    res = res.replace(/:ghost:/g, '👻');
    res = res.replace(/:alien:/g, '👽');
    res = res.replace(/:robot:/g, '🤖');
    res = res.replace(/:thumbsup:/g, '👍');
    res = res.replace(/:thumbsdown:/g, '👎');
    res = res.replace(/:dog:/g, '🐶');
    res = res.replace(/:cat:/g, '🐱');
    res = res.replace(/:mouse:/g, '🐭');
    res = res.replace(/:hamster:/g, '🐹');
    res = res.replace(/:fox:/g, '🦊');
    res = res.replace(/:bear:/g, '🐻');
    res = res.replace(/:panda:/g, '🐼');
    res = res.replace(/:koala:/g, '🐨');
    res = res.replace(/:tiger:/g, '🐯');
    res = res.replace(/:lion:/g, '🦁');
    res = res.replace(/:cow:/g, '🐮');
    res = res.replace(/:pig:/g, '🐷');
    res = res.replace(/:chicken:/g, '🐔');
    res = res.replace(/:penguin:/g, '🐧');
    res = res.replace(/:duck:/g, '🦆');
    res = res.replace(/:bat:/g, '🦇');
    res = res.replace(/:wolf:/g, '🐺');
    res = res.replace(/:horse:/g, '🐴');
    res = res.replace(/:unicorn:/g, '🦄');
    res = res.replace(/(:bee:|:wasp:)/g, '🐝');
    res = res.replace(/:caterpillar:/g, '🐛');
    res = res.replace(/:butterfly:/g, '🦋');
    res = res.replace(/:snail:/g, '🐌');
    res = res.replace(/:ant:/g, '🐜');
    res = res.replace(/(:cricket:|:grasshopper:)/g, '🦗');
    res = res.replace(/:spider:/g, '🕷');
    res = res.replace(/:scorpion:/g, '🦂');
    res = res.replace(/:turtle:/g, '🐢');
    res = res.replace(/:snake:/g, '🐍');
    res = res.replace(/:lizard:/g, '🦎');
    res = res.replace(/:octopus:/g, '🐙');
    res = res.replace(/(:prawn:|:shrimp:)/g, '🦐');
    res = res.replace(/:shark:/g, '🦈');
    res = res.replace(/:crocodile:/g, '🐊');
    res = res.replace(/:elephant:/g, '🐘');
    res = res.replace(/:rhino:/g, '🦏');
    res = res.replace(/:turkey:/g, '🦃');
    res = res.replace(/:dove:/g, '🕊');
    res = res.replace(/:dragon:/g, '🐉');
    res = res.replace(/:vampire:/g, '🧛');
    res = res.replace(/:programmer:/g, '👨‍💻');
    res = res.replace(/:laptop:/g, '💻');
    res = res.replace(/:grinning:/g, '😀');
    res = res.replace(/:grin:/g, '😁');
    res = res.replace(/:rofl:/g, '🤣');
    res = res.replace(/:smiley:/g, '😃');
    res = res.replace(/:smile:/g, '😄');
    res = res.replace(/:sweat_smile:/g, '😅');
    res = res.replace(/:laughing:/g, '😆');
    res = res.replace(/:wink:/g, '😉');
    res = res.replace(/:blush:/g, '😊');
    res = res.replace(/:yum:/g, '😋');
    res = res.replace(/:sunglasses:/g, '😎');
    res = res.replace(/:heart_eyes:/g, '😍');
    res = res.replace(/:kiss:/g, '😘');
    res = res.replace(/:kissing:/g, '😗');
    res = res.replace(/:kissing_smiling_eyes:/g, '😙');
    res = res.replace(/:kissing_closed_eyes:/g, '😚');
    res = res.replace(/:slight_smile:/g, '🙂');
    res = res.replace(/:hugging:/g, '🤗');
    res = res.replace(/:thinking:/g, '🤔');
    res = res.replace(/:neutral_face:/g, '😐');
    res = res.replace(/:expressionless:/g, '😑');
    res = res.replace(/:no_mouth:/g, '😶');
    res = res.replace(/:rolling_eyes:/g, '🙄');
    res = res.replace(/:smirk:/g, '😏');
    res = res.replace(/:persevere:/g, '😣');
    res = res.replace(/:disappointed_relieved:/g, '😥');
    res = res.replace(/:open_mouth:/g, '😮');
    res = res.replace(/:zipper_mouth:/g, '🤐');
    res = res.replace(/:hushed:/g, '😯');
    res = res.replace(/:sleepy:/g, '😪');
    res = res.replace(/:tired_face:/g, '😫');
    res = res.replace(/:sleeping:/g, '😴');
    return res.trim();
}