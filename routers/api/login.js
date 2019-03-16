const users = require('../../db/users.json');
const bcrypt = require('bcrypt');

module.exports = (req, res) => {
    if(!req.body.username) return res.send({ status: 0 });
    if(!req.body.password) return res.send({ status: 0 });
    const user = users.filter(u => u.username == req.body.username)[0];
    
    if(!user) return res.send({ status: 0 });
    if(!bcrypt.compareSync(req.body.password, user.password)) return res.send({ status: 0 });

    res.send({
        status: 1,
        token: user.token
    });
}