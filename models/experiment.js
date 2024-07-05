const {Schema} = require('mongoose');
const mongoose = require("mongoose");

const experimentSchema =
    new Schema({logJson: String});

module.exports = mongoose.model('Experiment', experimentSchema);