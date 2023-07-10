// const fetch = require("node-fetch");
const axios = require("axios");
const querystring = require("querystring");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;

require("dotenv").config();

const {
    BACKEND_REDIRECT_URI_SPOTIFY,
    BACKEND_CLIENT_ID_SPOTIFY,
    BACKEND_CLIENT_SECRET_SPOTIFY,
    BACKEND_REDIRECT_URI_YOUTUBE,
    BACKEND_CLIENT_ID_YOUTUBE,
    BACKEND_CLIENT_SECRET_YOUTUBE,
    BACKEND_SCOPE_YOUTUBE,
    YOUTUBE_API_KEY,
} = process.env;

class DataManager {
    constructor() {
        this.data = [];
        this.accessToken = "";
    }

    setAccessToken(newAccessToken) {
        this.accessToken = newAccessToken;
    }
    getAccessTokenData() {
        return this.accessToken;
    }

    getData() {
        return this.data;
    }

    setData(newData) {
        this.data = newData;
    }

    addItem(item) {
        this.data.push(item);
    }

    removeItem(index) {
        this.data.splice(index, 1);
    }
}

const dataManager = new DataManager();

// Exchange authorization code for access token
const getAccessToken = async (authorizationCode) => {
    const tokenEndpoint = "https://accounts.spotify.com/api/token";
    const authString = `${BACKEND_CLIENT_ID_SPOTIFY}:${BACKEND_CLIENT_SECRET_SPOTIFY}`;
    const encodedAuthHeader = Buffer.from(authString).toString("base64");
    const requestBody = {
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: BACKEND_REDIRECT_URI_SPOTIFY,
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
    const authorizeUrl = `https://accounts.spotify.com/authorize?client_id=${BACKEND_CLIENT_ID_SPOTIFY}&response_type=code&redirect_uri=${encodeURIComponent(
        BACKEND_REDIRECT_URI_SPOTIFY
    )}&scope=user-library-read`;

    res.json({ url: authorizeUrl });
};

exports.getSpotifyToken = (req, res) => {
    const { code } = req.query;
    req.session.accessToken = code;
    const value = true;
    res.cookie("value", value);
    res.redirect("http://localhost:3000");
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
        const likedSongs = await getLikedSongs(accessToken);

        res.status(200).json({ likedSongs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

const likeVideo = (
    videoName,
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    redirectUrl
) => {
    return new Promise((resolve, reject) => {
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
                    reject(err);
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
                                    reject(err);
                                } else {
                                    resolve(res);
                                }
                            }
                        );
                    } else {
                        reject("No videos found.");
                    }
                }
            }
        );
    });
};

exports.getYoutubeToken = async (req, res, next) => {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            BACKEND_CLIENT_ID_YOUTUBE,
            BACKEND_CLIENT_SECRET_YOUTUBE,
            BACKEND_REDIRECT_URI_YOUTUBE
        );
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: BACKEND_SCOPE_YOUTUBE,
        });

        res.set({
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        });
        res.status(200).json({ status: "success", url: authorizeUrl });
    } catch (error) {
        next(error);
    }
};

exports.oauth2callback = async (req, res, next) => {
    try {
        const oAuth2Client = new OAuth2(
            BACKEND_CLIENT_ID_YOUTUBE,
            BACKEND_CLIENT_SECRET_YOUTUBE,
            BACKEND_REDIRECT_URI_YOUTUBE
        );

        const { code } = req.query;

        const { tokens } = await oAuth2Client.getToken(code);
        dataManager.setAccessToken(tokens);

        res.redirect(`http://localhost:3000/?likeSongBool=true`);
    } catch (error) {
        next(error);
    }
};

let likedSongsCount = 0;
exports.likeSongsOnYoutube = async (req, res, next) => {
    try {
        const tokens = dataManager.getAccessTokenData();

        const data = dataManager.getData();
        const totalSongs = data.length;
        const intervalId = setInterval(async () => {
            if (data.length > 0) {
                const videoName = data.shift();
                try {
                    await likeVideo(
                        videoName,
                        tokens.access_token,
                        tokens.refresh_token,
                        BACKEND_CLIENT_ID_YOUTUBE,
                        BACKEND_CLIENT_SECRET_YOUTUBE,
                        BACKEND_REDIRECT_URI_YOUTUBE
                    );
                    console.log("Success");
                    likedSongsCount++;
                } catch (error) {
                    dataManager.setAccessToken("");
                    console.error(error);
                    clearInterval(intervalId);
                    return res.status(500).json({
                        status: "error",
                        message: "An error occurred while liking the songs",
                    });
                }
            } else {
                dataManager.setAccessToken("");
                clearInterval(intervalId);
                res.status(200).json({
                    status: "success",
                    message: `${likedSongsCount} out of ${totalSongs} songs liked successfully`,
                });
            }
        }, 1000);
    } catch (error) {
        console.log(error);
        dataManager.setAccessToken("");
        next(error);
    }
};
