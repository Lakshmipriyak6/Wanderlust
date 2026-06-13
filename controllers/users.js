const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
    console.log("renderSignupForm called");
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        console.log("Registered User:", registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                console.log("Login Error:", err);
                req.flash(
                    "error",
                    "Error logging in after registration. Please try logging in manually."
                );
                return res.redirect("/login");
            }
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });
    } catch (err) {
        console.log(err);
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};
module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!");

    let redirectUrl = res.locals.redirectUrl || "/listings";

    res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.log(err);
            req.flash("error", "Error logging out. Please try again.");
            return res.redirect("/listings");
        }
        req.flash("success", "You have been logged out successfully.");
        res.redirect("/listings");
    });
};

module.exports.profile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/listings');
    }
    res.render('users/profile.ejs', { user });
};

module.exports.offset = async (req, res) => {
    // Simple offset: plant trees to reduce carbon
    const trees = Number(req.body.trees) || 1;
    const reductionPerTree = 20; // kg CO2 per tree (approx)
    const user = await User.findById(req.user._id);
    user.treesPlanted = (user.treesPlanted || 0) + trees;
    user.carbonScore = Math.max(0, (user.carbonScore || 0) - trees * reductionPerTree);
    await user.save();
    req.flash('success', `Planted ${trees} tree(s). Carbon reduced by ${trees * reductionPerTree} kg.`);
    res.redirect('/profile');
};