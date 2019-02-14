const db = {};
db.chats = require('../db/chats.json');
db.ranks = require('../db/ranks.json');

exports = module.exports = {};

exports.run = (req, res) => {
    res.render("chats", {
        title: 'Chats',
        isAuthenticated: req.isAuthenticated(),
        cts: (db.ranks[req.user.rank].permissions.includes('seeAllChats')) ? db.chats : db.chats.filter(c => c.type == 'public'),
        perms: JSON.stringify(db.ranks[req.user.rank].permissions)
    });
}