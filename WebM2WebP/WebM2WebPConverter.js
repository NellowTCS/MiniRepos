// webmToWebpConverter.js
/**
 * A module for converting WebM video files to animated WebP format in the browser.
 * @module webmToWebpConverter
 */

/**
 * Shows the loading indicator
 * @private */
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('show');
    }
}

/**
 * Hides the loading indicator
 * @private */
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
 * Converts ImageData to Uint32Array in 0xRRGGBBAA format.
 * @private
 * @param {ImageData} imageData - The ImageData from canvas.
 * @returns {Uint32Array} The RGBA data.
 */
function imageDataToRgba(imageData) {
    const rgba = new Uint32Array(imageData.width * imageData.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        rgba[i / 4] = (r << 24) | (g << 16) | (b << 8) | a;
    }
    return rgba;
}

/**
 * Ensures that the webpxmux.js library is loaded.
 * @private
 * @returns {Promise<Object>} A promise that resolves with the WebPXMux class.
 */
async function ensureWebPXMux() {
    if (!window.WebPXMux) {
        await loadScript('https://cdn.jsdelivr.net/npm/webpxmux@0.0.2/dist/webpxmux.min.js');
    }

    if (!window.WebPXMux) {
        throw new Error('Failed to load webpxmux.js library');
    }

    return window.WebPXMux;
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

        await ensureWebPXMux();

        const video = document.createElement('video');
        const videoUrl = URL.createObjectURL(webmFile);
        video.src = videoUrl;
        video.muted = true; // Mute to allow autoplay
        video.preload = 'metadata';

        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = () => reject(new Error('Failed to load video'));
        });

        const duration = video.duration;
        const totalFrames = Math.ceil(duration * fps);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = scaleWidth;
        canvas.height = Math.round(video.videoHeight * scaleWidth / video.videoWidth);

        const mux = new WebPXMux('https://cdn.jsdelivr.net/npm/webpxmux@0.0.2/dist/webpxmux.wasm');
        await mux.waitRuntime();

        const frameDuration = Math.round(1000 / fps); // duration per frame in ms
        const frames = [];

        for (let i = 0; i < totalFrames; i++) {
            const time = (i / fps);
            video.currentTime = time;

            await new Promise(resolve => {
                const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                video.addEventListener('seeked', onSeeked);
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const rgba = imageDataToRgba(imageData);
            frames.push({
                duration: frameDuration,
                isKeyframe: false,
                rgba: rgba
            });
        }

        const framesObj = {
            frameCount: totalFrames,
            width: canvas.width,
            height: canvas.height,
            loopCount: 0, // 0 for infinite loop
            bgColor: 0x00000000, // transparent
            frames: frames
        };

        const webpData = await mux.encodeFrames(framesObj);
        const webpBlob = new Blob([webpData], { type: 'image/webp' });

        URL.revokeObjectURL(videoUrl);

        return webpBlob;
    } catch (error) {
        console.error('Conversion failed:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Expose the function globally
window.convertWebmToWebp = convertWebmToWebp;