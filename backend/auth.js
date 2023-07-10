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
    //  enables credentials such as cookies and authorization headers
    credentials: true,
    optionsSuccessStatus: 200,
};
// apply options to entire application
app.use(cors(corsOptions));

app.use(
    session({
        secret: "my secret",
        // whether the session should be saved to the store on every request, even if it hasnt been modified
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            httpOnly: true,
            // maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
);

app.use(bodyParser.json());
app.use("/feed", feedRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

app.listen(8080, () => {
    console.log("Server started on port 8080");
});

// SPECIFY REQUESTS SPECIFICLY FROM URL
// app.use(cors({
//     origin: 'http://example.com'
//   }));
