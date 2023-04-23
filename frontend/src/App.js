import React, { useState } from "react";
import axios from "axios";

const Buttons = () => {
    const [spinner, setSpinner] = useState(false);
    const handleAuthorizationYoutube = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8080/feed/youtube/token`
            );

            window.location.href = response.data.url;
        } catch (error) {
            console.log(error);
        }
    };

    const handle = async () => {
        setSpinner(true);
        const response = await axios.get(
            "http://localhost:8080/feed/spotify/liked",
            {
                withCredentials: true,
            }
        );
        setSpinner(false);
    };

    const handleLogin = async () => {
        try {
            const response = await axios.get(
                "http://localhost:8080/feed/spotify/code"
            );
            window.location.href = response.data.url;
        } catch (error) {
            console.log(error);
        }
    };
    return (
        <>
            <button onClick={handleLogin}>Log in with Spotify</button>
            <button onClick={handle}>Get spotify Songs</button>
            <button onClick={handleAuthorizationYoutube}>
                Add Songs to Youtube
            </button>
            {spinner && "Loading"}
        </>
    );
};

const App = () => {
    return (
        <>
            <ol>
                <li>Log in with Spotify</li>
                <li>Give server all songs</li>
                <li>Like the songs</li>
            </ol>
            <Buttons />
        </>
    );
};

export default App;
