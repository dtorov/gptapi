const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    yagpt: {
        OAuth_token: 'y0_AgAAAAALbAxQAATuwQAAAAELOCcAAADOm3lt-F1FRKDeuQN86H0iBAJZXw',
        IAM_TOKEN: { type: String, default: ''},
        FOLDER_ID: { type: String, default: ''},
        model: { type: String, default: ''},
        completionOptions: {
            stream: {type: Boolean, default: false},
            temperature: {type: Number, default: 0.6},
            maxTokens: {type: Number, default: 2000}
        },
        defaultModel: { type: String, default: 'yandexgpt-lite'},
        apiURL: { type: String, default: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'}
    },
    creationDate: { type: Date, default: Date.now }
});

// Компилируем и Экспортируем модель
module.exports = mongoose.model('SystemSettings', systemSettingsSchema);