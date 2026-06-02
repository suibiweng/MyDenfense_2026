# Dissertation Defense Recording Page — YouTube Embed Version

This folder is ready for GitHub Pages. It includes a Zoom-like recording page with:

- YouTube embedded video player
- Searchable/clickable transcript
- Meeting chat panel
- Caption, transcript, and chat download links
- No large MP4 file required in GitHub

## 1. Upload your video to YouTube

Upload the Zoom `.mp4` recording to YouTube.

Recommended visibility:

```txt
Unlisted
```

This means the video will not be searchable on YouTube, but anyone with the link can view it.

## 2. Copy the YouTube video ID

Example YouTube URL:

```txt
https://www.youtube.com/watch?v=ABC123XYZ
```

The video ID is:

```txt
ABC123XYZ
```

## 3. Paste the ID into `script.js`

Open `script.js` and replace this:

```js
youtubeVideoId: "PASTE_YOUR_YOUTUBE_VIDEO_ID_HERE",
```

with this:

```js
youtubeVideoId: "ABC123XYZ",
```

## 4. Optional: upload captions to YouTube too

The page includes:

```txt
assets/captions.vtt
assets/transcript.vtt
assets/chat.txt
```

For captions inside the YouTube player, upload `assets/captions.vtt` in YouTube Studio under **Subtitles**.

The GitHub page still shows the transcript and chat separately even if you do not upload captions to YouTube.

## 5. Deploy on GitHub Pages

Push all files to your GitHub repository, then go to:

```txt
Settings → Pages → Build and deployment → Source: Deploy from a branch
```

Choose:

```txt
main / root
```

## Notes

- This version does **not** need `recording.mp4` in the repository.
- The transcript click-to-time feature uses the YouTube iframe API. It should work after you paste the real YouTube video ID and publish via GitHub Pages.
- If the video is private instead of unlisted, the embedded player may not work for other visitors.
