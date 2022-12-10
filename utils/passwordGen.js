const bcrypt = require("bcryptjs");

const genPass = async str => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(str, salt);
    console.log(hash);
    return hash;
}

genPass("johndoe");
