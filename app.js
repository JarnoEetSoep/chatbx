const express = require('express');
const app = express();
let db = {};
db.chats = require('./db/chats.json');
db.users = require('./db/users.json');
db.emoji = require('./db/emoji.json');
db.ranks = require('./db/ranks.json');
const fs = require('fs');
const https = require('https');
const path = require('path');
const colors = require('colors');
const commandHandler = require('./command-handler.js');
const uuid = require('uuid/v4');
const expressSession = require('express-session');
const store = new (require('connect-mongo')(expressSession)) ({
    // url: 'mongodb://localhost/chatbx-sessions'
    url: `mongodb://admin:${encodeURIComponent('[6YzB>LV:7Xp')}@chatbx-shard-00-00-o65kb.azure.mongodb.net:27017,chatbx-shard-00-01-o65kb.azure.mongodb.net:27017,chatbx-shard-00-02-o65kb.azure.mongodb.net:27017/chatbx?ssl=true&replicaSet=chatbx-shard-0&authSource=admin&retryWrites=true`
});
const cookieparser = require('cookie-parser');
const passportSocketIo = require('passport.socketio');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const sharedsession = require('express-socket.io-session');

if(!process.env.SECRET_KEY_BASE) process.env.SECRET_KEY_BASE = 'Keyboard cat';
const session = expressSession({
    genid: () => uuid(),
    secret: process.env.SECRET_KEY_BASE,
    resave: true,
    saveUninitialized: true,
    store: store
});
const pp2sio = new class pp2sio extends require('events') { constructor() { super() } };

passport.use(new LocalStrategy((username, password, done) => {
    let user = db.users.filter(u => u.username == username)[0];
    if(!user) return done(null, false, { message: 'Incorrect username.' });
    if(user.password != password) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    let user = db.users.filter(u => u.id == id)[0];
    if(!user) user = false;
    done(null, user);
});

const cert = {
    key: fs.readFileSync(path.join(__dirname, '/cert/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '/cert/server.crt'))
};

const server = https.createServer(cert, app);
const io = require('socket.io')(server);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieparser('Keyboard cat'));
app.use((err, req, res, next) => {
    res.status(err.status).send('Jammerrrr.');
});

app.get('/', (req, res) => require('./routers/index').run(req, res));
app.get('/chats/:chatId', (req, res) => require('./routers/chat').run(req, res));
app.get('/emoji(list)?', (req, res) => require('./routers/emoji').run(req, res));
app.get('/chats', (req, res) => require('./routers/chats').run(req, res));
app.get('/about', (req, res) => require('./routers/about').run(req, res));
app.get('/users', (req, res) => require('./routers/users').run(req, res));
app.get('/login', (req, res) => require('./routers/login').run(req, res));
app.get('/logout', (req, res) => require('./routers/logout').run(req, res, pp2sio));
app.get('/users/:userId', (req, res) => require('./routers/user').run(req, res));

app.post('/login', (req, res, next) => require('./routers/posts/login').run(req, res, next, passport, pp2sio));
app.post('/register', (req, res, next) => {
    require('./routers/posts/register').run(req, res, next, passport, db.users);
    db.users = require('./db/users.json');
    require('./routers/posts/login').run(req, res, next, passport, pp2sio);
});

const getSockets = room => {
    return Object.entries(io.sockets.adapter.rooms[room] === undefined ?
    {} : io.sockets.adapter.rooms[room].sockets )
        .filter(([id, status]) => status)
        .map(([id]) => io.sockets.connected[id])
}

let users = [];

io.use(sharedsession(session));
io.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: process.env.SECRET_KEY_BASE,
    store: store,
    passport: passport,
    cookieParser: cookieparser,
    fail: (data, msg, err, accept) => accept(null, true)
}));

io.on('connection', socket => {
    console.log(colors.green.bold(`New user connected from ${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`));
    
    if(socket.request.user && socket.request.user.logged_in) {
        socket.user = {
            name: socket.request.user.username,
            rank: socket.request.user.rank,
            id: socket.id
        };
    } else {
        socket.user = {
            name: socket.request.connection.remoteAddress,
            rank: 'guest',
            id: socket.id
        };
    }
    users.push(socket.user);

    pp2sio.on('logout', data => {
        socket.disconnect(true);
    });

    socket.on('join', data => {
        socket.chatId = data.chatId;
        socket.join(data.chatId);

        let a = 0;
        let ips = [];
        getSockets(socket.chatId).forEach(sock => {
            a++;
            ips.push({
                ip: `${sock.request.connection.remoteAddress}:${socket.request.connection.remotePort}`,
                username: sock.user.name
            });
        });

        socket.emit('initialize', { amount: a, usernames: ips });
        socket.broadcast.to(socket.chatId).emit('chatter_joined', {
            username: socket.user.name,
            ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`
        });
    });
    
    socket.on('message', data => {
        if(!db.ranks[socket.user.rank].permissions.includes('sendMessages')) return socket.emit('message', { message: "[Bx] You are not allowed to send messages", username: "" });
        
        if(data.message.startsWith('/') && db.ranks[socket.user.rank].permissions.includes('commands')) {
            return commandHandler(io, socket, data.message.trim(), users, db, getSockets);
        }

        let msg = messageParser(data.message, db.ranks, db.ranks[socket.user.rank].permissions, socket.user);
        socket.broadcast.to(socket.chatId).emit('othermessage', { message: msg });
        socket.emit('message', { message: msg });
    });

    socket.on('typing', () => {
        socket.broadcast.to(socket.chatId).emit('typing', { username: socket.user.name });
    });

    socket.on('disconnect', () => {
        socket.broadcast.to(socket.chatId).emit('chatter_left', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}` });
        console.log(colors.red.bold(`${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort} disconnected`));
    });

    socket.on('getChats', () => {
        cts = (db.ranks[socket.user.rank].permissions.includes('seeAllChats')) ? db.chats : db.chats.filter(c => c.type == 'public');
        socket.emit('giveChats', {
            chats: cts,
            perms: db.ranks[socket.user.rank].permissions
        });
    });

    socket.on('newChat', data => {
        if(!db.ranks[socket.user.rank].permissions.includes("createChats")) return;

        let chatId;
        do {
            let chars = [];
            for(let x = 0; x < 10; x++) {
                chars.push(Math.floor(Math.random() * 10));
            }
            chatId = chars.join('');
        } while(db.chats.filter(c => c.id == chatId).length != 0);

        let pathName = (db.ranks[socket.user.rank].permissions.includes('createChatByName')) ? (data.nameAsPath) ? data.name : chatId : chatId;
        if(db.chats.filter(c => c.path == pathName).length != 0) {
            if(data.nameAsPath) return socket.emit('createChatError', `Chat with path /chats/${pathName} does already exist`);
            else return socket.emit('createChatError', `This error should NEVER occur. Take contact with a developer about 'error 100'`);
        }

        db.chats.push({
            name: data.name,
            id: chatId,
            path: pathName,
            type: (data.visible) ? 'public' : 'private'
        });

        fs.writeFileSync('./db/chats.json', JSON.stringify(db.chats,null,4));
        socket.emit('chatCreated', { url: `/chats/${pathName}` });
    });
});

messageParser = (msg, ranks, perms, user) => {
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
        return `${ranks[user.rank].prefix}${user.name}${ranks[user.rank].suffix}${re}`;
    });
    // markdown layout __, _, **, *
    res = res.replace(/__(\S+)__/g, '<b>$1</b>');
    res = res.replace(/\*\*(\S+)\*\*/g, '<b>$1</b>');
    res = res.replace(/_(\S+)_/g, '<i>$1</i>');
    res = res.replace(/\*(\S+)\*/g, '<i>$1</i>');
    // emoji
    db.emoji.forEach(e => res = res.replace(new RegExp(e.regexp, 'g'), e.value));

    res = res.trim();
    
    return `${ranks[user.rank].prefix}${user.name}${ranks[user.rank].suffix}${res}`;
}

server.listen(process.env.PORT || 443, "0.0.0.0", () => console.log(colors.bold(`Connected on ${server.address().address}:${server.address().port}\n`)));