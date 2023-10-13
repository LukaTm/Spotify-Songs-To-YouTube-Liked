import { NextResponse } from "next/server";
import { google } from "googleapis";
const { OAuth2 } = google.auth;

import dotenv from "dotenv";

dotenv.config();

const {
    BACKEND_CLIENT_ID_YOUTUBE,
    BACKEND_CLIENT_SECRET_YOUTUBE,
    BACKEND_REDIRECT_URI_YOUTUBE,
    BACKEND_SCOPE_YOUTUBE,
} = process.env;

export async function GET(req, res, next) {
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

        return NextResponse.json(
            { status: "success", url: authorizeUrl },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to generate the YouTube authorization URL" },
            { status: 500 }
        );
    }
}
