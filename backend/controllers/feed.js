const fetch = require("node-fetch");
const axios = require("axios");
const querystring = require("querystring");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;

// const apiKey = process.env.API_KEY;
require("dotenv").config();

const REDIRECT_URI_SPOTIFY = process.env.BACKEND_REDIRECT_URI_SPOTIFY;
const CLIENT_ID_SPOTIFY = process.env.BACKEND_CLIENT_ID_SPOTIFY;
const CLIENT_SECRET_SPOTIFY = process.env.BACKEND_CLIENT_SECRET_SPOTIFY;

const REDIRECT_URI_YOUTUBE = process.env.BACKEND_REDIRECT_URI_YOUTUBE;
const CLIENT_ID_YOUTUBE = process.env.BACKEND_CLIENT_ID_YOUTUBE;
const CLIENT_SECRET_YOUTUBE = process.env.BACKEND_CLIENT_SECRET_YOUTUBE;
const SCOPE_YOUTUBE = process.env.BACKEND_SCOPE_YOUTUBE;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const dataManager = (() => {
    let data = [];

    const getData = () => {
        return data;
    };

    const setData = (newData) => {
        data = newData;
    };

    const addItem = (item) => {
        data.push(item);
    };

    const removeItem = (index) => {
        data.splice(index, 1);
    };

    return {
        getData,
        setData,
        addItem,
        removeItem,
    };
})();

// Exchange authorization code for access token
const getAccessToken = async (authorizationCode) => {
    const tokenEndpoint = "https://accounts.spotify.com/api/token";
    const authString = `${CLIENT_ID_SPOTIFY}:${CLIENT_SECRET_SPOTIFY}`;
    const encodedAuthHeader = Buffer.from(authString).toString("base64");
    const requestBody = {
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: REDIRECT_URI_SPOTIFY,
    };
    const config = {
        headers: {
            Authorization: `Basic ${encodedAuthHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };
    try {
        const response = await axios.post(
            tokenEndpoint,
            querystring.stringify(requestBody),
            config
        );
        return response.data.access_token;
    } catch (error) {
        console.error(error);
        throw new Error("Error getting access token");
    }
};

exports.getSpotifyCode = async (req, res) => {
    const authorizeUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID_SPOTIFY}&response_type=code&redirect_uri=${encodeURIComponent(
        REDIRECT_URI_SPOTIFY
    )}&scope=user-library-read`;

    res.json({ url: authorizeUrl });
};

exports.getSpotifyToken = async (req, res, next) => {
    req.session.accessToken = req.query.code;
    try {
        res.redirect("http://localhost:3000");
    } catch (error) {
        next(error);
    }
};

exports.getLikedSongsController = async (req, res, next) => {
    const authorizationCode = req.session.accessToken;
    if (!authorizationCode) {
        return res
            .status(401)
            .json({ message: "Authorization code not found" });
    }
    try {
        const accessToken = await getAccessToken(authorizationCode);
        console.log("Access Token:", accessToken);
        const likedSongs = await getLikedSongs(accessToken);

        res.json({ likedSongs });
    } catch (error) {
        next(error);
    }
};

// Get user's liked songs using access token
const getLikedSongs = async (
    accessToken,
    limit = 50,
    offset = 0,
    tracks = []
) => {
    const apiUrl = `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`;
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };
    try {
        const response = await axios.get(apiUrl, config);
        const pageTracks = response.data.items;
        if (pageTracks.length === 0) {
            const songList = tracks.map(
                (song) =>
                    `${song.track.name} by ${song.track.artists
                        .map((artist) => artist.name)
                        .join(", ")}`
            );
            dataManager.setData(songList);
            return;
        }
        const allTracks = [...tracks, ...pageTracks];
        return getLikedSongs(accessToken, 50, offset + 50, allTracks);
    } catch (error) {
        console.error(error);
        throw new Error("Error getting user's liked songs");
    }
};

function likeVideo(
    videoName,
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    redirectUrl,
    callback
) {
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    const youtube = google.youtube({
        version: "v3",
        auth: oauth2Client,
    });

    youtube.search.list(
        {
            q: videoName,
            type: "video",
            order: "relevance",
            part: "id,snippet",
        },
        (err, res) => {
            if (err) {
                callback(err);
            } else {
                const videos = res.data.items;
                if (videos.length > 0) {
                    const videoId = videos[0].id.videoId;
                    youtube.videos.rate(
                        {
                            id: videoId,
                            rating: "like",
                            part: "snippet",
                        },
                        (err, res) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, res);
                            }
                        }
                    );
                } else {
                    callback("No videos found.");
                }
            }
        }
    );
}

exports.getYoutubeToken = async (req, res, next) => {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            CLIENT_ID_YOUTUBE,
            CLIENT_SECRET_YOUTUBE,
            REDIRECT_URI_YOUTUBE
        );
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPE_YOUTUBE,
        });

        res.set({
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        });
        res.json({ url: authorizeUrl });
    } catch (error) {
        next(error);
    }
};

exports.oauth2callback = async (req, res, next) => {
    try {
        const oAuth2Client = new OAuth2(
            CLIENT_ID_YOUTUBE,
            CLIENT_SECRET_YOUTUBE,
            REDIRECT_URI_YOUTUBE
        );

        const { code } = req.query;

        // exchange the authorization code for an access token and refresh token
        const { tokens } = await oAuth2Client.getToken(code);

        const data = dataManager.getData();
        let x = 0;
        const intervalId = setInterval(() => {
            if (x < data.length) {
                likeVideo(
                    data[x],
                    tokens.access_token,
                    tokens.refresh_token,
                    CLIENT_ID_YOUTUBE,
                    CLIENT_SECRET_YOUTUBE,
                    REDIRECT_URI_YOUTUBE,
                    (err, res) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(`Success`);
                        }
                    }
                );
                x++;
            } else {
                clearInterval(intervalId);
                res.send("Success");
            }
        }, 2000);
    } catch (error) {
        next(error);
    }
};
