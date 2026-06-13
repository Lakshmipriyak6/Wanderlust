const Listing = require("../models/listing");

const hasValidCoordinates = (listing) => {
    const coordinates = listing?.geometry?.coordinates;
    return Array.isArray(coordinates)
        && coordinates.length === 2
        && coordinates.every((coordinate) => typeof coordinate === "number")
        && !(coordinates[0] === 0 && coordinates[1] === 0);
};

const geocodeListing = async (listing) => {
    if (!process.env.MAP_TOKEN) return;

    const place = [listing.location, listing.country].filter(Boolean).join(", ");
    if (!place) return;

    let data;
    try {
        const response = await fetch(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(place)}.json?key=${process.env.MAP_TOKEN}`
        );
        if (!response.ok) return;
        data = await response.json();
    } catch (err) {
        console.error("MapTiler geocoding failed:", err.message);
        return;
    }

    if (data.features && data.features.length > 0) {
        listing.geometry = {
            type: "Point",
            coordinates: data.features[0].center,
        };
    }
};

module.exports.index = async (req, res) => {
    console.log("INDEX CONTROLLER HIT");

    const allListings = await Listing.find({});

    console.log("Listings count:", allListings.length);

    res.render("listings/index", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
        let { id } = req.params;
        const listing = await Listing.findById(id)
        .populate({path:"reviews", 
            populate:{
                path:"author",
            },
        })
        .populate("owner");
        if (!listing) {
            req.flash("error","Listing you requested does not exist!");
            return res.redirect("/listings");
        }
        if (!hasValidCoordinates(listing)) {
            await geocodeListing(listing);
            if (hasValidCoordinates(listing)) {
                await listing.save();
            }
        }

        console.log(listing.image);
        // Determine ghost visibility
        const now = Date.now();
        const isGhostActive = listing.isGhost && listing.ghostExpires && listing.ghostExpires.getTime() > now;
        let revealed = false;
        if (!isGhostActive) {
            revealed = true;
        } else if (req.user) {
            revealed = listing.revealedTo.map((id) => id.toString()).includes(req.user._id.toString());
        }

       res.render("listings/show.ejs", {
    listing,
    mapToken: process.env.MAP_TOKEN,
    isGhostActive,
    revealed,
});
    };

module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    await geocodeListing(newListing);
    newListing.image = { url, filename };
    newListing.owner = req.user._id;
    // Process ghost and eco fields
    if (req.body.listing.isGhost) {
        newListing.isGhost = true;
        if (req.body.listing.ghostPrice) newListing.ghostPrice = Number(req.body.listing.ghostPrice);
        if (req.body.listing.ghostExpires) newListing.ghostExpires = new Date(req.body.listing.ghostExpires);
    }
    newListing.ecoCertified = !!req.body.listing.ecoCertified;
    console.log(newListing.geometry);
    await newListing.save();
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing= await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true, runValidators: true }
    );
    await geocodeListing(listing);

    if (typeof req.file !== 'undefined') {
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image = { url, filename };
    }
    // Process ghost and eco fields from form
    if (req.body.listing.isGhost) {
        listing.isGhost = true;
        listing.ghostPrice = req.body.listing.ghostPrice ? Number(req.body.listing.ghostPrice) : listing.ghostPrice;
        listing.ghostExpires = req.body.listing.ghostExpires ? new Date(req.body.listing.ghostExpires) : listing.ghostExpires;
    } else {
        listing.isGhost = false;
        listing.ghostPrice = undefined;
        listing.ghostExpires = undefined;
        listing.revealedTo = [];
    }
    listing.ecoCertified = !!req.body.listing.ecoCertified;
    await listing.save();
    req.flash("success","Listing updated successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.bookListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    // Expect client to send distanceKm and stayDays and travelMode
    const distanceKm = Number(req.body.distanceKm) || 0;
    const stayDays = Number(req.body.stayDays) || 1;
    const mode = (req.body.travelMode || "flight").toLowerCase();
    const factors = { flight: 0.2, car: 0.12, train: 0.06 };
    const factor = factors[mode] || 0.15;
    const carbon = distanceKm * factor + stayDays * 15;

    const user = req.user;
    user.carbonScore = (user.carbonScore || 0) + carbon;
    await user.save();

    // reveal listing to this user
    const userIdStr = req.user._id.toString();
    if (!listing.revealedTo.map((i) => i.toString()).includes(userIdStr)) {
        listing.revealedTo.push(req.user._id);
    }
    await listing.save();

    req.flash("success", `Booked! Carbon added: ${carbon.toFixed(2)} kg`);
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
        let { id } = req.params;
        await Listing.findByIdAndDelete(id);
                req.flash("success","Listing deleted successfully!");
        res.redirect("/listings");
    };
