const { model, Schema } = require("mongoose");

const AdminSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    isAdmin: {
        type: String,
        required: false,
        default: false
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

const Admin = model("Admin", AdminSchema);

module.exports = Admin;