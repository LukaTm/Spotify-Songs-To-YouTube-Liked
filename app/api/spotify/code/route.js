import dotenv from "dotenv";
import { NextResponse } from "next/server";

dotenv.config();

const { BACKEND_CLIENT_ID_SPOTIFY, BACKEND_REDIRECT_URI_SPOTIFY } = process.env;

export async function GET(req, res, next) {
    try {
        const authorizeUrl = `https://accounts.spotify.com/authorize?client_id=${BACKEND_CLIENT_ID_SPOTIFY}&response_type=code&redirect_uri=${encodeURIComponent(
            BACKEND_REDIRECT_URI_SPOTIFY
        )}&scope=user-library-read`;
        return NextResponse.json({ url: authorizeUrl }, { status: 200 });
    } catch (err) {
        console.log(err);
        return NextResponse.json(
            {
                message:
                    "An error occurred while generating the Spotify authorization URL",
            },
            { status: 500 }
        );
    }
}
