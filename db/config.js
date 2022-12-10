const { connect } = require("mongoose");


const connectDB = async () => {
    connect(process.env.mongo_uri)
        .then(() => console.log(`Mongodb connected`))
        .catch(err => console.log(err));
}

module.exports = connectDB;
