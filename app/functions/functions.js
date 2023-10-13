import { NextResponse } from "next/server";
const axios = require("axios");
import querystring from "querystring";
import { google } from "googleapis";
const { OAuth2 } = google.auth;

import dotenv from "dotenv";
dotenv.config();

const {
    BACKEND_CLIENT_ID_SPOTIFY,
    BACKEND_CLIENT_SECRET_SPOTIFY,
    BACKEND_REDIRECT_URI_SPOTIFY,
} = process.env;

class DataManager {
    constructor() {
        this.data = [];
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
        // api/spotify/token
        const response = await axios.post(
            tokenEndpoint,
            querystring.stringify(requestBody),
            config
        );

        return response.data.access_token;
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error getting access token" },
            { status: 500 }
        );
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
            return songList;
        }
        const allTracks = [...tracks, ...pageTracks];
        return getLikedSongs(accessToken, 50, offset + 50, allTracks);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Failed to retrieve liked songs" },
            { status: 500 }
        );
    }
};

const likeVideo = async (
    videoName,
    accessToken,
    clientId,
    clientSecret,
    redirectUrl
) => {
    try {
        const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
        oauth2Client.setCredentials({
            access_token: accessToken,
        });

        const youtube = google.youtube({
            version: "v3",
            auth: oauth2Client,
        });

        // Use async/await to make the API call
        const searchResponse = await youtube.search.list({
            q: videoName,
            type: "video",
            order: "relevance",
            part: "id,snippet",
        });

        const videos = searchResponse.data.items;

        if (videos && videos.length > 0) {
            const videoId = videos[0].id.videoId;
            const { data } = await youtube.videos.rate({
                id: videoId,
                rating: "like",
                part: "snippet",
            });

            return data;
        } else {
            console.log("Video not found with the specified name: ", videoName);
            return NextResponse.json(
                { message: "Video not found with the specified name" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { message: "Failed to like the video" },
            { status: 500 }
        );
    }
};

export { likeVideo, getAccessToken, getLikedSongs, dataManager };
