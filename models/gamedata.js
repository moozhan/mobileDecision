const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameDataSchema = new Schema({
    username: { type: String, required: true },
    indecision: { type: Array, default: [] },
    userdetails: { type: Object, default: {} },
    experiments: { type: Array, default: [] }
});

module.exports = mongoose.model('GameData', gameDataSchema);