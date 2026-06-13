const express=require("express");
const app=express();
const users = require("./routes/users.js");
const posts = require("./routes/posts.js");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

const sessionOptions={
    secret:"mysupersecretkey",
    resave:false,
    saveUninitialized:true,
};

app.use(session(sessionOptions));
app.use(flash());

app.use((req,res,next)=>{
        res.locals.successMsg=req.flash("success");
        res.locals.errorMsg=req.flash("error");
    next();
});

app.get("/register",(req,res)=>{
    let{name="Anonymous"}=req.query;
    req.session.name = name;
    if(name==="Anonymous"){
        req.flash("error", "Registration failed!");   
    }else{
        req.flash("success", "Registration successful!");
    }
    res.redirect("/hello");
});

app.get("/hello",(req,res)=>{
    res.render("page.ejs",{name:req.session.name});
});

//express-session middleware adds a session object to the request, which can be used to store data across multiple requests from the same client.
//  The session data is stored on the server, and a unique session ID is sent to the client as a cookie.
// This allows you to maintain stateful information about the user, such as login status or preferences, across different requests and pages.


// app.get("/reqcount",(req,res)=>{
//     if(req.session.count){
//         req.session.count++;
//     } else {
//         req.session.count = 1;
//     }
//     res.send(`You send a request ${req.session.count} times`);
// });


// app.get("/test",(req,res)=>{
//     res.send("test successful!");
// });

//  Using cookie-parser middleware
// app.use(cookieParser("secretKey123"));

// app.get("/getsignedcookie",( req, res )=>{
//     res.cookie("madeIn","India",{signed:true});
//     res.send("Signed cookie has been set");
// });

// app.get("/verifycookie",(req,res)=>{
//     console.log(req.signedCookies);
//     res.send("verified");
// });

// app.get("/getcookies",(req,res)=>{
//     res.cookie("greet","namaste");
//     res.cookie("MadeIn","India");
//     res.send("Cookie has been set");
// });

// app.get("/greet",(req,res)=>{
//     let{name="anonymous"}=req.cookies;
//     res.send(`Hi, ${name}!`);
// });
// app.get("/",(req,res)=>{
//     console.dir(req.cookies);
//     res.send("Hi,I am root!");
// });

// app.use("/users",users);
// app.use("/posts",posts);

app.listen(3000,()=>{
    console.log("Serving on port 3000");
});