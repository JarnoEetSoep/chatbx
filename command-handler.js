module.exports = (io, socket, message, users, db, getSockets) => {
    let cmd = message.slice(1).toLowerCase();
    let args = message.split(' ').slice(1);

    if(cmd == 'help') {

        socket.emit('message', { message: '[Bx]: Help message<br>[Bx]: Commands:<br>[Bx]:     /help<br>[Bx]:     /whisper &lt;chatter&gt; &lt;message&gt;<br><br>Commands and parameters with an asterisk, are Admin-only' });

    } else if(cmd == 'whisper') {

        if(args.length < 2) return socket.emit('message', { message: '[Bx]: You have to enter all parameters' });
        if(users.filter(n => n.name == args[0]).length != 0) {
            socket.to(users.filter(n => n.username == args[0]).id).emit('othermessage', { message: `[${socket.user.name}] whispers: <i>${args[1]}</i>` });
            socket.emit('message', { message: `You whispered <i>${args[1]}</i> to '${args[0]}'` });
        } else {
            socket.emit('message', { message: `[Bx]: '${args[0]}' is not online` });
        }

    }
}