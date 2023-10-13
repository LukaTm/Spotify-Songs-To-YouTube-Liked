import { NextResponse } from "next/server";
import { google } from "googleapis";
const { OAuth2 } = google.auth;

import dotenv from "dotenv";
import { cookies } from "next/headers";

dotenv.config();

const {
    BACKEND_CLIENT_ID_YOUTUBE,
    BACKEND_CLIENT_SECRET_YOUTUBE,
    BACKEND_REDIRECT_URI_YOUTUBE,
} = process.env;

export async function GET(req, res, next) {
    try {
        const oAuth2Client = new OAuth2(
            BACKEND_CLIENT_ID_YOUTUBE,
            BACKEND_CLIENT_SECRET_YOUTUBE,
            BACKEND_REDIRECT_URI_YOUTUBE
        );

        const url = new URL(req.url, "https://transfer-songs-luka.vercel.app");
        const code = url.searchParams.get("code");

        const { tokens } = await oAuth2Client.getToken(code);

        const value = true;
        cookies().set("likeSongBool", value);
        cookies().set("access_token", tokens.access_token);

        return NextResponse.redirect("https://transfer-songs-luka.vercel.app");
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { message: "Failed to process the YouTube OAuth request" },
            { status: 500 }
        );
    }
}
