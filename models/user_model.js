const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    telegram: Object,
    maker: Object,
    context: [{
        role: { type: String }, 
        content: { type: String }
    }],
    role: {
        name: { type: String, default: ''},
        role: { type: String, default: 'system'},
        content: { type: String, default: ''}
    },
    balance: {
        amount: {type: Number, default: 100},
        parent: { type: String, default: ''}
    },
    usageLimits: {
        day: {
            yagpt: {type: Number, default: 10000},
            openai: {type: Number, default: 10000},
            cloude: {type: Number, default: 10000}
        }
    },
    creationDate: { type: Date, default: Date.now }
});

// Компилируем и Экспортируем модель
module.exports = mongoose.model('User', UserSchema);