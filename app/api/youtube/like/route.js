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

export async function POST(req, res) {
    let likedSongsCount = 0;
    const songs = await req.json();
    const userSpotifySongs = songs.userSpotifySongs;

    try {
        const ACCESS_TOKEN = cookies().get("access_token");
        const TOKENS = ACCESS_TOKEN.value;
        dataManager.setData([]);
        dataManager.setData(userSpotifySongs);
        const data = dataManager.getData();
        const totalSongs = data.length;

        // Process liked songs using a loop
        for (const videoName of data) {
            try {
                const response = await likeVideo(
                    videoName,
                    TOKENS,
                    BACKEND_CLIENT_ID_YOUTUBE,
                    BACKEND_CLIENT_SECRET_YOUTUBE,
                    BACKEND_REDIRECT_URI_YOUTUBE,
                    likedSongsCount,
                    totalSongs
                );

                if (response && response.status === 200) {
                    console.log("Success");
                    likedSongsCount++;
                } else {
                    console.error(response.error);
                    return res.status(500).json({
                        status: "error",
                        message: `${likedSongsCount} out of ${totalSongs} songs liked successfully`,
                    });
                }
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    status: "error",
                    message: `Failed to like the song '${videoName}'`,
                });
            }

            await delay(1000);
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
            {
                message: `${likedSongsCount} out of ${totalSongs} songs liked successfully`,
            },
            { status: 500 }
        );
    }
}
