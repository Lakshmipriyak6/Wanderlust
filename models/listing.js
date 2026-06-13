const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const ListingSchema = new Schema({
    title:{
        type: String,
        required: true,
    },
    description:String,
 image: {
    url:String,
    filename:String,
 },
    geometry:{
         type: {
        type: String,
        enum: ["Point"],
        default: "Point",
    },
     coordinates: {
        type: [Number],
        default: [0, 0],
    },
    },

    price: Number,
    location:String,
    country:String,
    // Ghost listing fields
    isGhost: { type: Boolean, default: false },
    ghostExpires: Date,
    ghostPrice: Number,
    // list of users (ObjectId) who have booked and are allowed to see full details
    revealedTo: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    // Eco flag
    ecoCertified: { type: Boolean, default: false },
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review"
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    }
});

ListingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
});

const Listing = mongoose.model("Listing", ListingSchema);
module.exports = Listing;

