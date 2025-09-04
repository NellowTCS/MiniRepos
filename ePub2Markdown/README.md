# ePub2Markdown

A simple browser-based tool that converts **`.epub` eBooks into clean Markdown.** 
No installs, no server, just open the HTML file and drop in your book.

Built with plain JavaScript, [JSZip](https://stuk.github.io/jszip/), and a little bit of HTML/CSS polish.

---

## Features

* Drag + drop or file picker support for `.epub` files
* Converts chapters into Markdown with:

  * Headings (`<h1>–<h6>` → `#` in Markdown)
  * Paragraphs + line breaks
  * Bold, italic, links
  * Lists (ordered + unordered)
  * Blockquotes
* Logs and progress bar to track conversion
* Cleans up weird EPUB formatting (extra whitespace, odd HTML tags, entities)
* Output appears in a text area for easy copy/paste

---

## Usage

### Online
1. Open the GitHub Pages link in a modern browser.
2. Drop in an `.epub` file or click the file picker.
3. Wait a few seconds while chapters convert.
4. Copy the Markdown from the output box.

### Local
1. Clone/download this repo.
2. Open `index.html` in a modern browser.
3. Drop in an `.epub` file or click the file picker.
4. Wait a few seconds while chapters convert.
5. Copy the Markdown from the output box.

---

## Project Structure

* `index.html`: Everything lives here (HTML, CSS, JS all in one file, though this may be separated in the future).
* [JSZip](https://cdnjs.com/libraries/jszip) → Handles `.epub` file unpacking.

No external backend required. 100% client-side, as almost all of my projects are!

---

## Notes

* Not all EPUBs are standardized well; fallback parsing is included, but some books may need manual cleanup.
* Images, tables, and fancy formatting aren’t handled (for now).
* Output is meant to be **readable Markdown first**, not perfect one-to-one conversion.

---

## Future Ideas

* Add support for images → auto-extract + link in Markdown
* Smarter handling of EPUB metadata (title, author, TOC)
* Export as `.md` file directly instead of copy/paste
