import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import dotenv from "dotenv";
dotenv.config();
const {
    BACKEND_CLIENT_ID_YOUTUBE,
    BACKEND_CLIENT_SECRET_YOUTUBE,
    BACKEND_REDIRECT_URI_YOUTUBE,
} = process.env;

import { dataManager } from "../../../functions/functions";
import { likeVideo } from "../../../functions/functions";

// COUNT LIKED SONGS
let likedSongsCount = 0;

export async function POST(req, res) {
    const songs = await req.json();
    const userSpotifySongs = songs.userSpotifySongs;

    try {
        const ACCESS_TOKEN = cookies().get("access_token");
        const TOKENS = ACCESS_TOKEN.value;

        dataManager.setData(userSpotifySongs);
        const data = dataManager.getData();
        const totalSongs = data.length;

        // Process liked songs using a loop
        for (const videoName of data) {
            try {
                await likeVideo(
                    videoName,
                    TOKENS,
                    BACKEND_CLIENT_ID_YOUTUBE,
                    BACKEND_CLIENT_SECRET_YOUTUBE,
                    BACKEND_REDIRECT_URI_YOUTUBE
                );
                console.log("Success");
                likedSongsCount++;
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    status: "error",
                    message: "Failed to like the song '${videoName}'",
                });
            }
        }

        return NextResponse.json(
            {
                status: "success",
                message: `${likedSongsCount} out of ${totalSongs} songs liked successfully`,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Failed to like songs" },
            { status: 500 }
        );
    }
}
