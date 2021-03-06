const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const colors = require('colors');
const commandHandler = require('./command-handler');
const uuid = require('uuid/v4');
const expressSession = require('express-session');
const store = new (require('connect-mongo')(expressSession)) ({
    url: (process.env.mongoURI) ? process.env.mongoURI : 'mongodb://localhost:27017/chatbx'
});
const cookieparser = require('cookie-parser');
const passportSocketIo = require('passport.socketio');
const bodyParser = require('body-parser');
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const sharedsession = require('express-socket.io-session');
const handler404 = require('./routers/404');
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;
const mongoose = require('mongoose');
const models = require('./models');

mongoose.connect((process.env.mongoURI) ? process.env.mongoURI : 'mongodb://localhost:27017/chatbx', { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', () => console.log(colors.white.bold('Mongoose connected\n')));

if(!process.env.SECRET_KEY_BASE) process.env.SECRET_KEY_BASE = 'Keyboard cat';
const session = expressSession({
    genid: () => uuid(),
    secret: process.env.SECRET_KEY_BASE,
    resave: true,
    saveUninitialized: true,
    store: store
});
const pp2sio = new class pp2sio extends require('events').EventEmitter {};  // PassPort to Socket.IO, we need it when we logout
pp2sio.setMaxListeners(10000);

passport.use(new LocalStrategy((username, password, done) => {
    db.collection('users').findOne({ username: username }).then(user => {
        if(!user) return done(null, false, { message: 'Incorrect username.' });
        if(!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
    }).catch(err => done(err));
}));

passport.serializeUser((user, done) => {
    done(null, user.userId);
});

passport.deserializeUser((id, done) => {
    db.collection('users').findOne({ userId: id }).then(user => {
        if(!user) user = false;
        done(null, user);
    }).catch(err => done(err));
});

const cert = {
    key: fs.readFileSync(path.join(__dirname, '/cert/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '/cert/server.crt'))
};

const server = (process.env.at_heroku) ? http.createServer(app) : https.createServer(cert, app);
const io = require('socket.io')(server);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieparser(process.env.SECRET_KEY_BASE));
app.use(redirectToHTTPS());

app.get('/', (req, res) => require('./routers/index').run(req, res));
app.get('/chats/:chatId', (req, res) => require('./routers/chat').run(req, res, db.collection('chats')));
app.get('/emoji(list)?', (req, res) => require('./routers/emoji').run(req, res));
app.get('/chats', (req, res) => require('./routers/chats').run(req, res, db.collection('chats'), db.collection('ranks')));
app.get('/about', (req, res) => require('./routers/about').run(req, res));
app.get('/users', (req, res) => require('./routers/users').run(req, res, db.collection('users')));
app.get('/login', (req, res) => require('./routers/login').run(req, res));
app.get('/register', (req, res) => require('./routers/register').run(req, res));
app.get('/logout', (req, res) => require('./routers/logout').run(req, res, pp2sio));
app.get('/users/:userId', (req, res) => require('./routers/user').run(req, res, db.collection('users')));
app.get('/dev/:devPath', (req, res) => require('./routers/dev').run(req, res));
app.get('/dev', (req, res) => res.redirect('/dev/home'));

app.post('/login', (req, res, next) => require('./routers/posts/login').run(req, res, next, passport, db));
app.post('/register', (req, res, next) => require('./routers/posts/register').run(req, res, next, passport, db));

// API
require('./api')(app, io, db);

app.use((req, res, next) => handler404.run(req, res));

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

    const logoutCb = () => {
        socket.disconnect(true);
    }

    pp2sio.once('logout', logoutCb);

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
        db.collection('ranks').findOne({ name: socket.user.rank }).then(rank => {
            if(!rank.permissions.includes('sendMessages')) return socket.emit('message', { message: '[Bx]: You are not allowed to send messages' });

            if(data.message.startsWith('/') && rank.permissions.includes('commands')) {
                return commandHandler(io, socket, data.message.trim(), users, db, getSockets);
            }

            let msg = messageParser(data.message, rank, socket.user);
            socket.broadcast.to(socket.chatId).emit('othermessage', { message: msg });
            socket.emit('message', { message: msg });
        });
    });

    socket.on('typing', () => {
        socket.broadcast.to(socket.chatId).emit('typing', { username: socket.user.name });
    });

    socket.on('disconnect', () => {
        socket.broadcast.to(socket.chatId).emit('chatter_left', { ip: `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}` });
        console.log(colors.red.bold(`${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort} disconnected`));

        pp2sio.removeListener('logout', logoutCb);
    });

    socket.on('newChat', data => {
        db.collection('ranks').findOne({ name: socket.user.rank }).then(rank => {
            if(!rank.permissions.includes('createChats')) return;

            let chatId = '';
            do {
                chatId = '';
                for(let x = 0; x < 10; x++) {
                    chatId += Math.floor(Math.random() * 10);
                }
            } while(findChatById(db, chatId));

            let pathName = (rank.permissions.includes('createChatByName')) ? (data.nameAsPath) ? data.name : chatId : chatId;
            if(findChatByPath(db, pathName)) {
                if(data.nameAsPath) return socket.emit('chatCreated', { error: `Chat with path /chats/${pathName} does already exist` });
                else return socket.emit('chatCreated', { error: `This error should NEVER occur. Take contact with a developer about 'error C100'` });
            }

            newChat = new models.chatModel({
                name: data.name,
                chatId: chatId,
                path: pathName,
                type: (data.visible) ? 'public' : 'private'
            });

            db.collection('chats').insertOne(newChat).then(chat => {
                socket.emit('chatCreated', { chat: { name: data.name, path: pathName }});
            }).catch(err => next(err));
        });
    });
});

const findChatById = (db, chatId) => {
    db.collection('chats').findOne({ chatId: chatId }).then(chat => {
        return chat;
    }).catch(() => {
        return null;
    });
}

const findChatByPath = (db, path) => {
    db.collection('chats').findOne({ path: path }).then(chat => {
        return chat;
    }).catch(() => {
        return null;
    });
}

const messageParser = (msg, rank, user) => {
    let res = ` ${msg} `;
    // special chars
    res = res.replace(/&/g,'&amp;');
    res = res.replace(/</g,'&lt;');
    res = res.replace(/>/g,'&gt;');
    res = res.replace(/'/g,'&#34;');
    res = res.replace(/'/g,'&#39;');
    // markdown hyperlinks: [google](https://www.google.com) => <a href="https://www.google.com">google</a>
    res = res.replace(/\[(.*?)\]\((https?:\/\/\w*\.\w*\.?[^\s]*)\)/g, '<a href="$2">$1</a>');
    // just a normal link: https://www.google.com => <a href="https://www.google.com">https://www.google.com</a>
    res = res.replace(/([\s](https?:\/\/\w*\.\w*\.?[^\s]*)[\s])/g, url => {
        let re = ` <a href="${url.trim()}">${url.trim()}</a> `;
        if(require('url').parse(url.trim()).path.match(/(.jpg|.png|.jpeg|.gif|.tiff)$/) && rank.permissions.includes('sendImages')) re += `\n<img src="${url.trim()}"></img>`
        return re;
    })
    // markdown layout __, **
    res = res.replace(/__(\S+)__/g, '<i>$1</i>');
    res = res.replace(/\*\*(\S+)\*\*/g, '<b>$1</b>');
    // emoji are done client side

    res = res.trim();
    
    return `${rank.prefix}${user.name}${rank.suffix}${res}`;
}

server.listen(process.env.PORT || 443, '0.0.0.0', () => console.log(colors.bold(`Connected on ${server.address().address}:${server.address().port}`)));