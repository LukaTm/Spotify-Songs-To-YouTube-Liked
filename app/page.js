"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import "./Home.css";

import { useCookies } from "react-cookie";
import { useRef } from "react";

const Buttons = () => {
    const [spinner, setSpinner] = useState(false);
    const [loadingText, setLoadingText] = useState(false);
    const [operationMessage, setOperationMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState(false);
    const [customErrorMessage, setCustomErrorMessage] = useState("");
    const [isLikingSongs, setIsLikingSongs] = useState(false);
    const userSpotifySongsRef = useRef([]);
    const startLikingSongsRef = useRef(false);
    const isProcessing = useRef(false);
    const isProcessingSpotfiy = useRef(false);
    const [cookies, setCookie, removeCookie] = useCookies(["likeSongBool"]);
    const [reRunCookies, setReRunCookie, removeReRunCookie] = useCookies([
        "value",
    ]);
    const [accessCookies, setAccessCookie, removeAccessCookie] = useCookies([
        "accessToken",
    ]);

    useEffect(() => {
        const storedSuccessMessage = localStorage.getItem("successMessage");
        if (storedSuccessMessage === "true") {
            setSuccessMessage(true);
        }
        localStorage.setItem("successMessage", false);
    }, []);

    useEffect(() => {
        const handle = async () => {
            setCustomErrorMessage("");
            removeReRunCookie("value");

            setSpinner(true);
            if (isProcessingSpotfiy.current) {
                return;
            }
            isProcessingSpotfiy.current = true;
            try {
                const response = await axios.get("api/spotify/liked", {
                    withCredentials: true,
                });
                if (
                    response.status === 200 &&
                    response.data.likedSongs.length > 0
                ) {
                    localStorage.setItem("successMessage", "true");
                    localStorage.setItem(
                        "spotifySongs",
                        JSON.stringify(response.data.likedSongs)
                    );
                    setSuccessMessage(true);
                } else {
                    setCustomErrorMessage(
                        "Something went wrong. Your email is not authorized in the app or You have no liked songs on Spotify"
                    );
                }
            } catch (err) {
                console.log(err);
                setSpinner(false);
            } finally {
                isProcessingSpotfiy.current = false;
                setSpinner(false);
            }
        };
        const handler = async () => {
            if (reRunCookies["value"] === "true") {
                await handle();
            }
        };
        handler();
    }, [reRunCookies, removeReRunCookie]);

    const handleAuthorizationYoutube = async () => {
        setCustomErrorMessage("");
        setErrorMessage(false);
        setSpinner(true);
        try {
            const response = await axios.get("api/youtube/token", {
                withCredentials: true,
            });
            if (response.status === 200) {
                // Redirect to the authorization URL received from the backend
                window.location.href = response.data.url;
            }
        } catch (error) {
            setErrorMessage(true);
            setSpinner(false);
            console.log(error);
        }
    };

    useEffect(() => {
        const savedSpotifySongs = localStorage.getItem("spotifySongs");
        if (savedSpotifySongs) {
            const decodedSongs = JSON.parse(savedSpotifySongs);
            userSpotifySongsRef.current = decodedSongs;
        }
        localStorage.removeItem("spotifySongs");
        const startLikingSongs = cookies.likeSongBool;
        if (startLikingSongs === "true") {
            startLikingSongsRef.current = true;
            removeCookie("likeSongBool");
        }
        const handleLikeSongs = async () => {
            if (isProcessing.current) {
                return;
            }
            setCustomErrorMessage("");
            isProcessing.current = true;
            setSuccessMessage(false);
            setSpinner(true);
            setLoadingText(true);
            setIsLikingSongs(true);
            try {
                const response = await axios.post(
                    "api/youtube/like",
                    { userSpotifySongs: userSpotifySongsRef.current },
                    { withCredentials: true }
                );
                if (response.status === 200) {
                    setOperationMessage(response.data.message);
                    setSpinner(false);
                    setLoadingText(false);
                    setIsLikingSongs(false);
                    userSpotifySongsRef.current = [];
                }
            } catch (error) {
                console.log(error);
                setSpinner(false);
                setLoadingText(false);
                setIsLikingSongs(false);
                setCustomErrorMessage(
                    `Something went wrong. Most likely, YouTube API daily limit has been exceeded.\n ${error.response.data.message}`
                );
            } finally {
                isProcessing.current = false;
            }
        };

        if (startLikingSongsRef.current === true) {
            startLikingSongsRef.current = false;
            handleLikeSongs();
        }
    }, [
        startLikingSongsRef,
        userSpotifySongsRef,
        cookies,
        setCookie,
        removeCookie,
        isLikingSongs,
    ]);

    const handleLogin = async () => {
        setCustomErrorMessage("");
        removeAccessCookie("accessToken");
        setErrorMessage(false);
        setSpinner(true);
        try {
            const response = await axios.get("api/spotify/code");
            window.location.href = response.data.url;
        } catch (error) {
            setSpinner(false);
            setErrorMessage(true);
            console.log(error);
        }
    };

    return (
        <div className="buttons-container">
            <button
                className="button"
                style={{
                    cursor: isLikingSongs ? "not-allowed" : "pointer",
                    opacity: isLikingSongs ? 0.3 : 1,
                }}
                onClick={async () => {
                    await handleLogin();
                }}
            >
                Log in with Spotify to give the app your liked songs
            </button>
            <button
                style={{
                    cursor: successMessage
                        ? "pointer"
                        : isLikingSongs
                        ? "not-allowed"
                        : "not-allowed",
                    opacity: successMessage ? 1 : isLikingSongs ? 0.3 : 0.3,
                }}
                className="button"
                onClick={successMessage ? handleAuthorizationYoutube : null}
            >
                Log in with YouTube and like spotify songs on YouTube
            </button>
            <div className="loading-container">
                {loadingText ? "Liking Songs" : ""}
                {spinner && <span className="spinner" />}
            </div>
            <span>{errorMessage ? "Something went wrong" : ""}</span>
            <span>{customErrorMessage}</span>
            <span>
                {successMessage
                    ? "Successfully logged in with spotify, now you can like songs on youtube by pressing the Button"
                    : ""}
            </span>
            <div className="operation-message">{operationMessage}</div>
        </div>
    );
};

const Home = () => {
    return (
        <div>
            <Buttons />
        </div>
    );
};

export default Home;
