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
 * Ensures that the ffmpeg worker is loaded.
 * @private
 * @returns {Promise<Object>} A promise that resolves with the worker.
 */
async function ensureFFmpeg() {
    // ffmpeg.js worker is loaded directly, no script loading needed as it's a worker script
    const worker = new Worker('https://cdn.jsdelivr.net/npm/ffmpeg.js@4.2.9003/ffmpeg-worker-webm.js');
    return new Promise((resolve, reject) => {
        worker.onmessage = function(e) {
            const msg = e.data;
            if (msg.type === 'ready') {
                resolve({ worker });
            }
        };
        worker.onerror = reject;
    });
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

        const { worker } = await ensureFFmpeg();

        const inputData = await webmFile.arrayBuffer();

        return new Promise((resolve, reject) => {
            worker.onmessage = function(e) {
                const msg = e.data;
                switch (msg.type) {
                    case 'stdout':
                        console.log('FFmpeg stdout:', msg.data);
                        break;
                    case 'stderr':
                        console.error('FFmpeg stderr:', msg.data);
                        break;
                    case 'done':
                        const result = msg.data;
                        const output = result.MEMFS.find(f => f.name === 'output.webp');
                        if (!output) {
                            reject(new Error('Output file not found'));
                            return;
                        }
                        resolve(new Blob([output.data], { type: 'image/webp' }));
                        break;
                    case 'exit':
                        if (msg.data !== 0) {
                            reject(new Error(`FFmpeg exited with code ${msg.data}`));
                        }
                        break;
                    case 'error':
                        reject(new Error(msg.data));
                        break;
                    case 'abort':
                        reject(new Error('FFmpeg aborted: ' + msg.data));
                        break;
                }
            };

            worker.postMessage({
                type: 'run',
                MEMFS: [{ name: 'input.webm', data: inputData }],
                arguments: [
                    '-i', 'input.webm',
                    '-vf', `scale=${scaleWidth}:-1:flags=lanczos,fps=${fps}`,
                    '-loop', '0',
                    '-an',
                    '-lossless', '0',
                    '-quality', `${quality}`,
                    'output.webp'
                ]
            });
        });
    } catch (error) {
        console.error('Conversion failed:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Expose the function globally
window.convertWebmToWebp = convertWebmToWebp;