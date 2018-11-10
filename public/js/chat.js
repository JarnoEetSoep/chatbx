$(() => {
    let message = $('#message');
    //let username = $('#username');
    let send_message = $('#send_message');
    //let send_username = $('#send_username');
    //let chatroom = $('#chatroom');

    socket.on('othermessage', data => {
        notification_sound.play();
        let d = new Date();
        $("#chatroom").prepend(`<p class="message">${(data.username != "") ? `${data.username}: ` : ""}${data.message}<i class="timestamp">${(d.getHours().toString().length == 1) ? `0${d.getHours()}` : d.getHours()}:${(d.getMinutes().toString().length == 1) ? `0${d.getMinutes()}` : d.getMinutes()}</i></p>`);
    });

    socket.on('message', data => {
        let d = new Date();
        $("#chatroom").prepend(`<p class="message">${(data.username != "") ? `${data.username}: ` : ""}${data.message}<i class="timestamp">${(d.getHours().toString().length == 1) ? `0${d.getHours()}` : d.getHours()}:${(d.getMinutes().toString().length == 1) ? `0${d.getMinutes()}` : d.getMinutes()}</i></p>`);
    });

    send_message.click(() => {
        sendMessage(message.val());
    });

    $('input#message').enterKey(() => {
        sendMessage(message.val());
    });

    $('#settingsModal').dialog({
        autoOpen: false,
        modal: true,
        width: 500,
        height: 550,
        resizable: false,
        draggable: false,
        show: {
            effect: "fade",
            duration: 1000
        },
        hide: {
            effect: "fade",
            duration: 1000
        },
        buttons: {
            Close: function() {
                $(this).dialog('close');
            }
        }
    });

    $('#settings').click(() => {
        $('#settingsModal').dialog('open');
    });

    $('#chusrname').click(() => {
        if($('#newusrname').val() == "") return;
        if($('#newusrname').val().includes(" ")) return alert("Username may not contain any whitespace");
        socket.emit('change_username', {username: $('#newusrname').val()});
        // $('#settingsModal').dialog('close');
        // $('#newusrname').val("");
    });

    $('#theme').change(() => {
        let theme = $('#theme option:selected').val();
        if(theme == "dark") {
            $('body').css('background-color','#000000');
            $('#buttons').css('background-color','#000000');
            $('body').css('color','#ffffff');
        } else if(theme == "light") {
            $('body').css('background-color','#ffffff');
            $('#buttons').css('background-color','#ffffff');
            $('body').css('color','#000000');
        }
        // $('#settingsModal').dialog('close');
    });

    $('#message').bind('keypress', () => {
        socket.emit('typing');
    });

    socket.on('typing', data => {
        $('#typing').text(`${data.username} is typing...`);
        let secs = 5;
        setInterval(() => {
            secs -= 1;
            if(secs == 0) {
                $('#typing').text('');
                clearInterval();
            }
        }, 5000);
    });

    socket.emit('join', { chatId: socket.chatId });

    socket.on('initialize', data => {
        chatter_amount = data.amount;
        $('#chatter_amount').text(chatter_amount);
        data.usernames.forEach(d => {
            $('#chatters').append(`<p id="${d.ip}">${d.username}</p>`);
        });
    });

    socket.on('chatter_joined', data => {
        chatter_amount++;
        $('#chatter_amount').text(chatter_amount);
        $('#chatters').append(`<p id="${data.ip}">${data.username}</p>`);
    });

    socket.on('chatter_left', data => {
        chatter_amount--;
        $('#chatter_amount').text(chatter_amount);
        $(`#${data.ip}`.replace(/(:|\.)/g, '\\$1')).remove();
    });

    socket.on('changename', data => {
        $(`#${data.ip}`.replace(/(:|\.)/g, '\\$1')).html(data.newname);
    });
});

const notification_sound = new Audio('/sound/notification.mp3');

$.fn.enterKey = function(fnc) {
    return this.each(function() {
        $(this).keypress(ev => {
            var keycode = (ev.keyCode) ? ev.keyCode : ev.which;
            if(keycode == '13') {
                fnc.call(this, ev);
            }
        });
    });
}

let chatter_amount = 1;

function sendMessage(msg) {
    if($('#message').val().trim() == "") return;
    $('#message').val("");
    socket.emit('message', {message: msg, username: socket.username});
}