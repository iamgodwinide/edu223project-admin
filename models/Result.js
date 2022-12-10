const { Schema, model } = require("mongoose");

const ResultSchema = new Schema({
    grade: {
        type: String,
        required: true
    },
    score: {
        type: String,
        required: true,
    },
    course: {
        type: String,
        required: true
    },
    credit: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    session: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    matno: {
        type: String,
        required: true
    },
    created: {
        type: String,
        required: false,
        default: Date.now()
    }
});

const Result = model("Result", ResultSchema);

module.exports = Result;