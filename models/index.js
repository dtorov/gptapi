
const mongoose = require('mongoose');

module.exports = {
  Conversation: require('./conversation_model'),
  User: require('./user_model'),
  SystemSettings: require('./system_settings_model'),
};