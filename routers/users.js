const db = {};
db.users = require('../db/users.json');

exports = module.exports = {};

exports.run = (req, res) => {
    res.render("users", {
        title: 'Users',
        isAuthenticated: req.isAuthenticated(),
        users: db.users
    });
}