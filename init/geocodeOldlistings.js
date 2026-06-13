require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("../models/listing");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");

    const listings = await Listing.find({});

    for (let listing of listings) {
        if (listing.geometry && listing.geometry.coordinates?.length) {
            continue;
        }

        try {
            const response = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(
                    listing.location
                )}.json?key=${process.env.MAP_TOKEN}`
            );

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                listing.geometry = {
                    type: "Point",
                    coordinates: data.features[0].center,
                };

                await listing.save();
                console.log(`Updated: ${listing.title}`);
            }
        } catch (err) {
            console.log(`Failed: ${listing.title}`);
        }
    }

    console.log("Done!");
    mongoose.connection.close();
}

main();