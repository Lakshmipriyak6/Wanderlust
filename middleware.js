const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema,reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
      if (!req.isAuthenticated()) {
        // Store the original URL they were trying to access
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be Logged in to create a listing!");
        res.redirect("/login");
        return;
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    } else {
        res.locals.redirectUrl = "/listings";
    }
    next();
};

module.exports.isOwner = async(req, res, next) => {
    let { id } = req.params;
    let listing= await Listing.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error","You do not have permission to edit this listing!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Validation Middleware
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}; 

module.exports.isReviewAuthor = async(req, res, next) => {
    let { reviewId } = req.params;
    let review = await Review.findById(reviewId);
if (!review.author.equals(req.user._id)) {
        req.flash("error","You do not have permission to edit this review!");
return res.redirect(`/listings/${req.params.id}`);
    }
    next();
};
