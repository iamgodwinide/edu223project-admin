const { model, Schema } = require("mongoose");


const MaterialSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    file: {
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

const Material = model("Material", MaterialSchema);

module.exports = Material;