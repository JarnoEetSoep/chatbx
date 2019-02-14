exports = module.exports = {};

exports.run = (req, res) => {
    res.render("about", {
        title: 'About',
        isAuthenticated: req.isAuthenticated()
    });
}