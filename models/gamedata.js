const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameDataSchema = new Schema({
    username: { type: String, required: true },
    data: { type: Object, required: true }
});

module.exports = mongoose.model('GameData', gameDataSchema);