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
        emoji: JSON.stringify(e),
        title: 'Emoji list',
        isAuthenticated: req.isAuthenticated(),
        categories: ['People1', 'People2', 'People3', 'People4', 'Flags', 'Symbols', 'Activity', 'Objects', 'Travel', 'Nature', 'Food', 'Regional', 'Modifier']
    });
}

const regexpToString = (regexp) => {
    if(regexp.startsWith(':') && regexp.endsWith(':')) {
        return regexp;
    } else {
        return regexp.slice(1, regexp.length - 1).split('|').join(' or ');
    }
}