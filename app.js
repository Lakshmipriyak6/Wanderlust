if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}

const express=require("express");
const app=express();
const mongoose=require("mongoose");
console.log("MAP TOKEN:", process.env.MAP_TOKEN);

const path = require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");




const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const Listing = require("./models/listing.js");

const { listingSchema, reviewSchema } = require("./schema.js");

// Fallback to local MongoDB when ATLASDB_URL isn't provided
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/Wanderlust";
 
let activeDbUrl = dbUrl;
async function main(){
    try{
        await mongoose.connect(dbUrl);
        console.log("connected to DB", dbUrl);
        activeDbUrl = dbUrl;
    }catch(err){
        console.error("Initial DB connection failed:", err.message);
        // If the provided URL looks like an Atlas SRV URL, try local fallback
        if (dbUrl && dbUrl.startsWith("mongodb+srv:") || (dbUrl && dbUrl.includes(".mongodb.net"))) {
            const fallback = "mongodb://127.0.0.1:27017/Wanderlust";
            console.log("Attempting local MongoDB fallback:", fallback);
            await mongoose.connect(fallback);
            console.log("connected to local fallback DB");
            activeDbUrl = fallback;
        } else {
            throw err;
        }
    }
}

main()
.then(() => {
    // Now that DB is connected, initialize session store and passport
    const sessionSecret = process.env.SECRET || 'thisshouldbeabettersecret';
    const store = MongoStore.create({
        mongoUrl: activeDbUrl,
        crypto: { secret: sessionSecret },
        touchAfter: 24 * 3600
    });
    store.on('error', function(e){
        console.log('SESSION STORE ERROR', e);
    });
    const sessionOptions={
        store,
        name: 'session',
        secret: sessionSecret,
        resave:false,
        saveUninitialized:false,
        cookie:{
            expires: new Date(Date.now()+15*24*60*60*1000),
            maxAge:15*24*60*60*1000,
            httpOnly:true,
        },
    };
    app.use(session(sessionOptions));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    app.use((req,res,next)=>{
        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        res.locals.currentUser = req.user;
        next();
    });

    // Mount routers that depend on sessions/passport
    app.use("/listings", listingRouter);
    app.use("/listings/:id/reviews", reviewRouter);
    app.use("/", userRouter);

    console.log("Database ready — starting server");
    app.listen(3000, () => {
        console.log("server is listening to port 3000");
    });
})
.catch((err) => {
    console.error("Failed to connect to any database:", err);
    process.exit(1);
});

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"public")));

// Session and passport setup will be initialized after DB connection to ensure
// the session store can be created using the resolved DB URL (and fallbacks).



app.get("/", (req, res) => {
    res.redirect("/listings");
});

// // Validation Middleware
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

const validateReview=(req,res,next) => {
     let {error} = reviewSchema.validate(req.body);
        if(error){
            let errMsg=error.details.map((el) => el.message).join(",");
            throw new ExpressError(400,errMsg);
        }else{
            next();
        }
};

// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({ 
//         email: "student@gmail.com", 
//         username: "delta-student",
//     });
    
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });

// ROUTERS
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Dev-only demo seeding route (creates demo user and demo ghost listing)
if (process.env.NODE_ENV !== 'production') {
    app.get('/seed-demo', async (req, res) => {
        try {
            const demoUsername = 'demo_user';
            const demoEmail = 'demo@example.com';
            const demoPassword = 'demopass';
            let demo = await User.findOne({ username: demoUsername });
            if (!demo) {
                demo = new User({ username: demoUsername, email: demoEmail });
                await User.register(demo, demoPassword);
            }

            let demoListing = await Listing.findOne({ title: 'Demo Ghost Listing' });
            if (!demoListing) {
                demoListing = new Listing({
                    title: 'Demo Ghost Listing',
                    description: 'This is a demo Ghost Drop visible for 24 hours only.',
                    price: 9999,
                    ghostPrice: 499,
                    isGhost: true,
                    ghostExpires: new Date(Date.now() + 24*60*60*1000),
                    image: { url: 'https://via.placeholder.com/800x450?text=Ghost+Demo', filename: 'demo.jpg' },
                    location: 'Hidden',
                    country: 'Unknown',
                    owner: demo._id,
                    ecoCertified: true,
                });
                await demoListing.save();
            }

            res.json({ demoUser: demoUsername, demoPassword, listingId: demoListing._id });
        } catch (err) {
            console.error('Seed demo error:', err);
            res.status(500).json({ error: err.message });
        }
    });
}

// Unconditional debug seed route (useful if NODE_ENV behaves unexpectedly)
app.get('/__seed_demo', async (req, res) => {
    try {
        const demoUsername = 'demo_user2';
        const demoEmail = 'demo2@example.com';
        const demoPassword = 'demopass2';
        let demo = await User.findOne({ username: demoUsername });
        if (!demo) {
            demo = new User({ username: demoUsername, email: demoEmail });
            await User.register(demo, demoPassword);
        }

        let demoListing = await Listing.findOne({ title: 'Demo Ghost Listing 2' });
        if (!demoListing) {
            demoListing = new Listing({
                title: 'Demo Ghost Listing 2',
                description: 'This demo Ghost Drop is for debugging.',
                price: 8000,
                ghostPrice: 399,
                isGhost: true,
                ghostExpires: new Date(Date.now() + 24*60*60*1000),
                image: { url: 'https://via.placeholder.com/800x450?text=Ghost+Debug', filename: 'demo2.jpg' },
                location: 'Hidden',
                country: 'Nowhere',
                owner: demo._id,
                ecoCertified: true,
            });
            await demoListing.save();
        }

        res.json({ demoUser: demoUsername, demoPassword, listingId: demoListing._id });
    } catch (err) {
        console.error('Seed demo error:', err);
        res.status(500).json({ error: err.message });
    }
});

//Index Route
app.get("/listings",wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    console.log("Listings count:", allListings.length);
    res.render("listings/index", { allListings });
}));

//New Route
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if(!listing){
        throw new ExpressError(404,"Listing not found");
    }
    res.render("listings/show.ejs",{listing});
}));

//Create Route
app.post(
    "/listings",
    validateListing,
    wrapAsync(async(req,res)=>{
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        throw new ExpressError(404,"Listing not found");
    }
    res.render("listings/edit.ejs",{listing});
}));

//Update Route
app.put("/listings/:id",
    validateListing,
    wrapAsync(async(req,res)=>{
        let{id}=req.params;
        await Listing.findByIdAndUpdate(id,{...req.body.listing});
        res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id",wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

// 404 Route
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Error Handler
app.use((err,req,res,next)=>{
   let{statusCode=500,message="Something went wrong!"}=err;
   res.status(statusCode).render("error.ejs",{message});
});

// Server is started after DB connection in the `main()` completion handler above.