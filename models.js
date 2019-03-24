const { Schema, model } = require('mongoose');

// User schema + model

const userSchema = new Schema({
    userId: String,
    username: String,
    password: String,
    rank: String
});

const userModel = model('userModel', userSchema);

// Rank schema + model

const rankSchema = new Schema({
    name: String,
    permissions: Array,
    prefix: String,
    suffix: String
});

const rankModel = model('rankModel', rankSchema);

// Chat schema + model

const chatSchema = new Schema({
    name: String,
    chatId: String,
    path: String,
    type: String
});

const chatModel = model('chatModel', chatSchema);

// Token schema + model

const tokenSchema = new Schema({
    user: String
});

const tokenModel = model('tokenModel', tokenSchema);

module.exports = {
    userModel: userModel,
    rankModel: rankModel,
    chatModel: chatModel,
    tokenModel: tokenModel
};