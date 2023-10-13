import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req, res, next) {
    try {
        // Replace 'http://localhost:3000' with your actual base URL.
        const url = new URL(req.url, "http://localhost:3000");
        const accessToken = url.searchParams.get("code");

        const value = true;

        cookies().set("value", value);
        cookies().set("accessToken", accessToken);

        return NextResponse.redirect("http://localhost:3000");
    } catch (err) {
        console.log(err);
        return NextResponse.json(
            { message: "Failed to process the request" },
            { status: 500 }
        );
    }
}
