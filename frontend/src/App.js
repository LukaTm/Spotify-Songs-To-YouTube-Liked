import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";

import "./App.css";

const Buttons = () => {
    const [spinner, setSpinner] = useState(false);
    const [loadingText, setLoadingText] = useState(false);
    const [operationMessage, setOperationMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState(false);
    const [cookies, setCookie, removeCookie] = useCookies(["value"]);

    useEffect(() => {
        const cookieValue = cookies["value"];
        if (cookieValue === "true") {
            setSuccessMessage(true);
        }
    }, [cookies, removeCookie]);

    useEffect(() => {
        const storedSuccessMessage = localStorage.getItem("successMessage");
        if (storedSuccessMessage === "true") {
            setSuccessMessage(true);
        }
        localStorage.removeItem("successMessage"); // Clear the stored value after retrieving it
    }, []);

    const handleAuthorizationYoutube = async () => {
        setErrorMessage(false);
        setSpinner(true);
        try {
            const response = await axios.get(
                "http://localhost:8080/feed/youtube/token",
                {
                    withCredentials: true,
                }
            );
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

    const handleLikeSongs = async () => {
        setSuccessMessage(false);
        setSpinner(true);
        setLoadingText(true);
        try {
            const response = await axios.get(
                "http://localhost:8080/feed/youtube/like",
                { withCredentials: true }
            );
            if (response.status === 200) {
                setOperationMessage(response.data.message);
                setSpinner(false);
                setLoadingText(false);
            }
        } catch (error) {
            console.log(error);
            setSpinner(false);
            setLoadingText(false);
        }
    };
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get("likeSongBool");
        console.log(accessToken);
        if (accessToken === "true") {
            handleLikeSongs();
        }
    }, []);

    const handle = async () => {
        setSpinner(true);
        try {
            const response = await axios.get(
                "http://localhost:8080/feed/spotify/liked",
                {
                    withCredentials: true,
                }
            );
            //   setSpinner(false);
            //   setSuccessMessage(true);
            if (response.status === 200) {
                localStorage.setItem("successMessage", "true"); // Store value in local storage
            }
        } catch (err) {
            console.log(err);
            setSpinner(false);
        }
    };

    const handleLogin = async () => {
        setErrorMessage(false);
        setSpinner(true);
        setSuccessMessage(false);
        try {
            const response = await axios.get(
                "http://localhost:8080/feed/spotify/code"
            );
            if (response.status === 200) {
                await handle();
            }
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
                style={{ cursor: "pointer" }}
                className="button"
                onClick={async () => {
                    await handleLogin();
                }}
            >
                Log in with Spotify and give the server the songs
            </button>
            <button
                style={{
                    cursor: successMessage ? "pointer" : "not-allowed",
                    opacity: successMessage ? 1 : 0.3,
                }}
                className="button"
                onClick={successMessage ? handleAuthorizationYoutube : null}
            >
                Like Songs on YouTube
            </button>
            <div className="loading-container">
                {loadingText ? "Liking Songs" : ""}
                {spinner && <span className="spinner" />}
            </div>
            <span>{errorMessage ? "Something went wrong" : ""}</span>
            <span>
                {successMessage
                    ? "Successfully logged in with spotify, now you can like songs on youtube by pressing the Button"
                    : ""}
            </span>
            <div className="operation-message">{operationMessage}</div>
        </div>
    );
};

const App = () => {
    return (
        <div className="container">
            <ol>
                <li>Log in with spotify and give server all liked songs</li>
                <li>Like spotify songs on YouTube</li>
            </ol>
            <Buttons />
        </div>
    );
};

export default App;
