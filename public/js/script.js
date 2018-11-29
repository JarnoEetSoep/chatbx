$(document).ready(() => {
    $('#login').dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        draggable: false,
        width: 650,
        height: 400,
        show: {
            effect: "fade",
            duration: 1000
        },
        hide: {
            effect: "fade",
            duration: 1000
        }
    });

    socket.on('logged-in', data => {
        $('#login').dialog('close');
    });

    socket.on('regError', msg => alert(msg));
    socket.on('loginError', msg => alert(msg));

    socket.on('redirect', data => window.location.href = data.url);
});

let username = false;
let password = false;

function checkUsername() {
    toCheck = $('#regUsername');
    if(!(toCheck.val().length > 1 && toCheck.val().length < 21 && toCheck.val().match(/^[0-9a-zA-Z_]+$/))) {
        $('#submitReg').attr('disabled', '');
        username = false;
        return toCheck.removeClass('is-valid').addClass('is-invalid');
    }
    toCheck.removeClass('is-invalid').addClass('is-valid');
    if(password) $('#submitReg').removeAttr('disabled');
    username = true;
}

function checkPass() {
    toCheck = $('#regPass');
    if(!(toCheck.val().length > 7 && toCheck.val().length < 21 && toCheck.val().match(/^[0-9a-zA-Z\(\)\[\]{}\"\':;,\.\/\?\\\|=\+-_\*&\^%\$#@!~\`<>]+$/))) {
        $('#submitReg').attr('disabled', '');
        password = false;
        return toCheck.removeClass('is-valid').addClass('is-invalid');
    }
    toCheck.removeClass('is-invalid').addClass('is-valid');
    if(username) $('#submitReg').removeAttr('disabled');
    password = true;
}