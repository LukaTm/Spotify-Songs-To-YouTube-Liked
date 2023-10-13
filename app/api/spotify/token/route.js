import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req, res, next) {
    try {
        // Replace 'https://transfer-songs-luka.vercel.app' with your actual base URL.
        const url = new URL(req.url, "https://transfer-songs-luka.vercel.app");
        const accessToken = url.searchParams.get("code");

        const value = true;

        cookies().set("value", value);
        cookies().set("accessToken", accessToken);

        return NextResponse.redirect("https://transfer-songs-luka.vercel.app");
    } catch (err) {
        console.log(err);
        return NextResponse.json(
            { message: "Failed to process the request" },
            { status: 500 }
        );
    }
}
