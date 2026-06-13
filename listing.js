const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
    title:{
        type: String,
        required: true,
    },
    description:String,
 image: {
    filename: {
        type: String,
        default: "listingimage"
    },
    url: {
        type: String,
        default: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60"
    }
},
    price: Number,
    location:String,
    country:String,
});

const Listing = mongoose.model("Listing", ListingSchema);
module.exports = Listing;

