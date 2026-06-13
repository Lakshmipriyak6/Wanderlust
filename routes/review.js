const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

const {
    validateReview,
    isLoggedIn,
    isReviewAuthor
}= require("../middleware.js");

const reviewControllers = require("../controllers/reviews.js");


// Create Review
router.post
    ("/", 
        isLoggedIn,
        validateReview, 
        wrapAsync(reviewControllers.createReview));

// Delete Review
router.delete(
    "/:reviewId", 
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewControllers.destroyReview));

module.exports = router;