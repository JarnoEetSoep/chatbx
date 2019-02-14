exports = module.exports = {};

exports.run = (req, res) => {
    res.render('login', {
        title: 'login',
        isAuthenticated: req.isAuthenticated()
    });
}