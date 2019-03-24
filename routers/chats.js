const { request, response } = require('express');
const { Collection } = require('mongoose');

exports = module.exports = {};

/**
 * 
 * @param {request} req 
 * @param {response} res 
 * @param {Collection} chats
 * @param {Collection} ranks
 */
exports.run = async (req, res, chats, ranks) => {
    let cts;
    if(req.user && (await ranks.findOne({ name: req.user.rank })).permissions.includes('seeAllChats')) cts = JSON.stringify(await chats.find({}).toArray());
    else cts = JSON.stringify(await chats.find({ type: 'public' }).toArray());

    let perms;
    if(req.user) perms = JSON.stringify((await ranks.findOne({ name: req.user.rank })).permissions);
    else perms = JSON.stringify((await ranks.findOne({ name: 'guest' })).permissions);
    
    res.render('chats', {
        title: 'Chats',
        isAuthenticated: req.isAuthenticated(),
        cts: cts,
        perms: perms
    });
}