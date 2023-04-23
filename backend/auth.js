const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");

const feedRoutes = require("./routes/feed");

const app = express();

// Middleware to set Access-Control-Allow-Origin header

// Allow requests from localhost:3000
const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(
    session({
        secret: "my secret",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
);

app.use(bodyParser.json());
app.use("/feed", feedRoutes);

app.listen(8080, () => {
    console.log("Server started on port 8080");
});

// SPECIFY REQUESTS SPECIFICLY FROM URL
// app.use(cors({
//     origin: 'http://example.com'
//   }));
