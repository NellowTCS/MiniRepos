// webmToWebpConverter.js
/**
 * A module for converting WebM video files to animated WebP format in the browser.
 * @module webmToWebpConverter
 */

/**
 * Shows the loading indicator
 * @private
 */
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('show');
    }
}

/**
 * Hides the loading indicator
 * @private
 */
function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('show');
    }
}

/**
 * Loads a script dynamically and returns a promise that resolves when the script is loaded.
 * @private
 * @param {string} src - The URL of the script to load.
 * @returns {Promise<void>} A promise that resolves when the script is loaded.
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Ensures that the ffmpeg.wasm instance is created and configured.
 * @private
 * @returns {Promise<Object>} A promise that resolves with the configured ffmpeg instance.
 */
async function ensureFFmpeg() {
    if (!window.FFmpegWASM) {
        await loadScript('https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js');
    }

    if (!window.FFmpegWASM) {
        throw new Error('Failed to load ffmpeg library');
    }

    const { FFmpeg } = FFmpegWASM;
    const ffmpeg = new FFmpeg();

    await ffmpeg.load();

    return { ffmpeg };
}

/**
 * Converts a WebM file to animated WebP format.
 * @async
 * @function convertWebmToWebp
 * @param {File|Blob} webmFile - The WebM file or blob to convert.
 * @param {Object} [options={}] - Conversion options.
 * @param {number} [options.fps=10] - Frames per second.
 * @param {number} [options.scaleWidth=512] - Max width (aspect ratio preserved).
 * @param {number} [options.quality=80] - WebP quality 0-100.
 * @returns {Promise<Blob>} A promise that resolves to an animated WebP Blob.
 * @throws {Error} If the input is invalid or conversion fails.
 */
async function convertWebmToWebp(webmFile, options = {}) {
    const { fps = 10, scaleWidth = 512, quality = 80 } = options;

    if (!(webmFile instanceof File) && !(webmFile instanceof Blob)) {
        throw new Error('Input must be a File or Blob');
    }

    try {
        showLoading();

        const { ffmpeg } = await ensureFFmpeg();

        // Write input file
        ffmpeg.writeFile('input.webm', new Uint8Array(await webmFile.arrayBuffer()));

        // Convert to animated WebP
        await ffmpeg.exec([
            '-i', 'input.webm',
            '-vf', `scale=${scaleWidth}:-1:flags=lanczos,fps=${fps}`,
            '-loop', '0',
            '-an',
            '-lossless', '0',
            '-quality', `${quality}`,
            'output.webp'
        ]);

        // Read output
        const output = await ffmpeg.readFile('output.webp');
        return new Blob([output], { type: 'image/webp' });
    } catch (error) {
        console.error('Conversion failed:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Expose the function globally
window.convertWebmToWebp = convertWebmToWebp;