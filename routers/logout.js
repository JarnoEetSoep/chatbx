exports = module.exports = {};

exports.run = (req, res, pp2sio) => {
    req.logout();
    res.redirect('back');
    return pp2sio.emit('logout');
}