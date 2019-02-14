const emoji = require('../db/emoji.json');
exports = module.exports = {};

exports.run = (req, res) => {
    let e = [];

    emoji.forEach(em => {
        e.push({
            name: regexpToString(em.regexp),
            value: em.value
        });
    });

    res.render('emoji', {
        emoji: e,
        title: 'Emoji list',
        isAuthenticated: req.isAuthenticated()
    });
}

const regexpToString = (regexp) => {
    if(regexp.startsWith(':') && regexp.endsWith(':')) {
        return regexp;
    } else {
        return regexp.slice(1, regexp.length - 1).split('|').join(' or ');
    }
}