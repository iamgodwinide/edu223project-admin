const express = require("express");
const app = express();
const expressLayout = require("express-ejs-layouts");
const fileUpload = require("express-fileupload");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport")

require("dotenv").config();
require("./db/config")();
require('./config/passport')(passport);

// MIDDLEWARES
app.use(express.static("./public"));
app.set("view engine", "ejs");
app.use(expressLayout);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './tmp/',
    limits: { fileSize: 10 * 1024 * 1024 },
}));

app.use(flash());
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// ROUTES
app.use("/", require("./routes/index"));
app.use("/", require("./routes/auth"));
app.use("/auth", require("./routes/auth"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server started on Port ${PORT}`));