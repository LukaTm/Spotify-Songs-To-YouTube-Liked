const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feed");

router.get("/youtube/token", feedController.getYoutubeToken);
router.get("/youtube/oauth2callback", feedController.oauth2callback);
router.get("/spotify/code", feedController.getSpotifyCode);
router.get("/spotify/token", feedController.getSpotifyToken);
router.get("/spotify/liked", feedController.getLikedSongsController);
router.get("/youtube/like", feedController.likeSongsOnYoutube);

module.exports = router;
