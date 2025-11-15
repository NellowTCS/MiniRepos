// mp3ToOggConverter.js
/**
 * A module for converting MP3 audio files to OGG format in the browser.
 * @module mp3ToOggConverter
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
 * Ensures that the encoder is created and configured.
 * @private
 * @returns {Promise<Object>} A promise that resolves with the configured encoder.
 */
async function ensureEncoder(sampleRate, channels, quality) {
    if (!window.WasmMediaEncoder) {
        await loadScript('https://unpkg.com/wasm-media-encoders/dist/umd/WasmMediaEncoder.min.js');
    }

    if (!window.WasmMediaEncoder) {
        throw new Error('Failed to load encoder library');
    }

    // Create encoder
    const encoder = await window.WasmMediaEncoder.createOggEncoder();

    // Configure encoder
    encoder.configure({
        channels: channels,
        sampleRate: sampleRate,
        vbrQuality: quality
    });

    return encoder;
}

/**
 * Converts an MP3 file to OGG format.
 * @async
 * @function convertMp3ToOgg
 * @param {File|Blob} mp3File - The MP3 file or blob to convert.
 * @param {Object} [options={}] - Conversion options.
 * @param {number} [options.quality=3.0] - OGG quality (0.0 to 10.0, default 3.0 ~ 128kbps).
 * @param {number} [options.sampleRate=44100] - Output sample rate in Hz.
 * @param {number} [options.chunkSize=4096] - Size of chunks to process (for large files).
 * @returns {Promise<Blob>} A promise that resolves to an OGG audio Blob.
 * @throws {Error} If the input is invalid or conversion fails.
 */
async function convertMp3ToOgg(mp3File, options = {}) {
    const { quality = 3.0, sampleRate = 44100, chunkSize = 4096 } = options;

    if (!(mp3File instanceof File) && !(mp3File instanceof Blob)) {
        throw new Error('Input must be a File or Blob');
    }

    try {
        showLoading();

        // Read MP3 file as ArrayBuffer
        const mp3ArrayBuffer = await mp3File.arrayBuffer();

        // Decode MP3 to PCM using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(mp3ArrayBuffer);
        await audioContext.close(); // Clean up AudioContext

        // Resample audio if needed
        let targetBuffer = audioBuffer;
        if (audioBuffer.sampleRate !== sampleRate) {
            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                Math.ceil(audioBuffer.length * sampleRate / audioBuffer.sampleRate),
                sampleRate
            );
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);
            source.start(0);
            targetBuffer = await offlineCtx.startRendering();
        }

        // Create and configure encoder
        const encoder = await ensureEncoder(
            sampleRate,
            targetBuffer.numberOfChannels,
            quality
        );

        // Process audio in chunks
        const resultParts = [];
        const length = targetBuffer.length;
        const numChannels = targetBuffer.numberOfChannels;

        for (let offset = 0; offset < length; offset += chunkSize) {
            const chunk = [];
            for (let ch = 0; ch < numChannels; ch++) {
                chunk.push(targetBuffer.getChannelData(ch).subarray(offset, offset + chunkSize));
            }
            const encodedChunk = encoder.encode(chunk);
            resultParts.push(new Uint8Array(encodedChunk));
        }

        // Finalize encoding
        const finalData = encoder.finalize();
        resultParts.push(new Uint8Array(finalData));

        // Create OGG Blob
        return new Blob(resultParts, { type: 'audio/ogg' });
    } catch (error) {
        console.error('Conversion failed:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Expose the function globally
window.convertMp3ToOgg = convertMp3ToOgg;
