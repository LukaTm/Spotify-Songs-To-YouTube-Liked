import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAccessToken } from "../../../functions/functions";
import { getLikedSongs } from "../../../functions/functions";

export async function GET(req, res, next) {
    const cookieStore = cookies();
    const authorizationCode = cookieStore.get("accessToken");

    if (!authorizationCode) {
        return NextResponse.json(
            { message: "No Access Token" },
            { status: 401 }
        );
    }
    try {
        const AUTHORIZATION_CODE = authorizationCode.value;

        const accessToken = await getAccessToken(AUTHORIZATION_CODE);
        if (!accessToken) {
            return NextResponse.json(
                { message: "Failed to retrieve the access token" },
                { status: 500 }
            );
        }
        const likedSongs = await getLikedSongs(accessToken);
        if (!likedSongs) {
            return NextResponse.json(
                { message: "Failed to retrieve liked songs" },
                { status: 500 }
            );
        }

        return NextResponse.json({ likedSongs }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { message: "An error occurred while processing data" },
            { status: 500 }
        );
    }
}
