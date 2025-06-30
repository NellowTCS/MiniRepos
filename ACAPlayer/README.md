 # AnimatedCoverArtPlayer
A cool little demo for animated cover art in mp3s

## How to
- This example shows how to embed an animated WebP image as the cover art inside an MP3’s ID3 tags, so it can be displayed and animated in compatible players like (*soon*) [HTMLPlayer](https://github.com/HTMLToolkit/HTMLPlayer).

- Steps
    1. Obtain your MP3 audio file (for example, I used Monody.mp3 by TheFatRat).
    2. Prepare your animated WebP cover art file (cover.webp).
    3. Use a tag editor that supports embedding WebP images (I recommend using [Banger.Show's Online ID3 Tag Editor](https://banger.show/tools/mp3-tag-editor))
    4. Open the MP3 in the tag editor.
    5. Replace the cover art with your animated WebP file.
    6. Save the file with the updated tags.
    7. (Optional) To verify, use ffmpeg to extract the cover:
```bash 
ffmpeg -i yourfile.mp3 -an -vcodec copy cover.webp
```

Once embedded, "upload" (all my tools are completely in browser) your MP3 to the player above, and if your browser supports animated WebP, the cover art will display and animate synced with playback.