module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Login required');
        res.redirect('/login');
    },
    ensureAdmin: function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.isAdmin) {
                return next();
            }
            req.flash('error_msg', 'Login required');
            res.redirect('/login');
        }
        req.flash('error_msg', 'Login required');
        res.redirect('/login');
    },
    forwardAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    }
};