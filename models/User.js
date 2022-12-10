const { model, Schema } = require("mongoose");


const UserSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    middlename: {
        type: String,
        required: false
    },
    matno: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    created: {
        type: String,
        required: false,
        default: Date.now()
    }
});

const User = model("User", UserSchema);

module.exports = User;