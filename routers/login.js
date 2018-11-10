exports = module.exports = {};

exports.run = (req, res) => {
    if(!req.query.return) return res.render('login', { returnUrl: req.protocol + '://' + req.get('host') });
    res.render('login', {
        returnUrl: req.query.return
    });
}