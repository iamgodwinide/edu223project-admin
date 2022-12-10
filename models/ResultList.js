const { Schema, model } = require("mongoose");

const ResultListSchema = new Schema({
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
    author: {
        type: String,
        required: true
    },
    created: {
        type: String,
        required: false,
        default: Date.now()
    }
});

const ResultList = model("ResultList", ResultListSchema);

module.exports = ResultList;