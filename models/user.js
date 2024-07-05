const mongoose = require('mongoose');
const Experiment = require("../models/experiment");

const userSchema = new mongoose.Schema({
    auth0Id: { type: String, required: true, unique: true },
    indecision: { type: Array, default: [] },
    userdetails: { type: Array, default: {} },
    experiments: { type: Array, default: [] }
});

module.exports = mongoose.model('User', userSchema);
