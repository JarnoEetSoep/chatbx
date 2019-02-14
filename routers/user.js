exports = module.exports = {};

exports.run = (req, res) => {
    let user = require('../db/users.json').filter(u => u.id == req.params.userId)[0];

    if(user) {
        res.render('user', {
            title: `User ${user.username}`,
            isAuthenticated: req.isAuthenticated()
        });
    } else {
        res.send('Not a valid user ' + req.params.userId);
    }
}