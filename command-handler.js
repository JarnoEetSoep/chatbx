module.exports = (io, socket, message, users, db, getSockets) => {
    let args = message.split(' ');
    let cmd = args.splice(0,1)[0].slice(1).toLowerCase();
    let perms = db.ranks[socket.user.rank].permissions;

    if(cmd == 'help') {

        socket.emit('message', { message: '[Bx]: Help message<br>[Bx]: Commands:<br>[Bx]:     /help<br>[Bx]:     /whisper &lt;chatter&gt; &lt;message&gt;<br>[Bx]:     /iframe* &lt;url&gt; [private: true|false]<br><br>Commands and parameters with an asterisk, are Admin-only' });

    } else if(cmd == 'whisper') {

        if(args.length < 2) return socket.emit('message', { message: '[Bx]: You have to enter all parameters' });
        if(args[0] == socket.user.name) return socket.emit('message', { message: '[Bx]: You can\'t whisper something to yourself' });
        if(users.filter(n => n.name == args[0]).length != 0) {
            io.to(users.filter(n => n.username == args[0]).id).emit('othermessage', { message: `[${socket.user.name}] whispers: <i>${args[1]}</i>` });
            socket.emit('message', { message: `You whispered <i>${args[1]}</i> to '${args[0]}'` });
        } else {
            socket.emit('message', { message: `[Bx]: '${args[0]}' is not online` });
        }

    } else if(cmd == 'iframe') {

        if(!['moderator', 'admin'].includes(socket.user.rank)) return socket.emit('message', { message: '[Bx]: You are not permitted to send iframes' });
        if(args.length < 1) return socket.emit('message', { message: '[Bx]: You have to enter all parameters' });
        if(args.length > 1 && args[1] != 'true') socket.to(socket.chatId).broadcast.emit('othermessage', { message: `<div style="width:35%;height:200px;" class="resizable"><iframe style="border:0;height:100%;width:100%;" src="${args[0]}"></iframe></div>` });
        socket.emit('message', { message: `<div style="width:35%;height:200px;" class="resizable"><iframe style="border:0;height:100%;width:100%;" src="${args[0]}"></iframe></div>` });
        if(args.length > 1 && args[1] != 'true') io.to(socket.chatId).emit('makeResizable', '.resizable');
        else socket.emit('makeResizable', '.resizable');

    }
}