exports = module.exports = {};

exports.run = (req, res) => {
    res.render("404", {
        title: '404 not found',
        isAuthenticated: req.isAuthenticated()
    });
}