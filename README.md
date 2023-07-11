# Spotify-to-Youtube-songs

This app transfers liked songs from Spotify to YouTube. Click the first button to log in with Spotify and provide the app with your liked songs from Spotify. Then, use the second button to log in with YouTube and provide the app with an OAuth2 access token, enabling the app to to like the spotify songs on YouTube. The app uses spotify song name along with the artist's name to search for YouTube videos using YouTube Data API and likes the most relevant video.

Note: The application is limited by the Free YouTube Data API's daily limit. This means that there is a maximum number of requests or actions that can be performed through the API within a 24-hour period.In such cases, you need to wait until the quota resets.
