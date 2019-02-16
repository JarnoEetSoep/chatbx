const db = {};
db.chats = require('../db/chats.json');
db.ranks = require('../db/ranks.json');

exports = module.exports = {};

exports.run = (req, res) => {
    let cts;
    if(req.user && db.ranks[req.user.rank].permissions.includes('seeAllChats')) cts = JSON.stringify(db.chats);
    else cts = JSON.stringify(db.chats.filter(c => c.type == 'public'));

    let perms;
    if(req.user) perms = JSON.stringify(db.ranks[req.user.rank].permissions);
    else perms = JSON.stringify(db.ranks.guest.permissions);
    
    res.render("chats", {
        title: 'Chats',
        isAuthenticated: req.isAuthenticated(),
        cts: cts,
        perms: perms
    });
}