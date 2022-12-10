const { model, Schema } = require("mongoose");


const DepartmentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    created: {
        type: String,
        required: false,
        default: Date.now()
    }
});

const Department = model("Department", DepartmentSchema);

module.exports = Department;