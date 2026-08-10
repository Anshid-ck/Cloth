// src/utils/colorExtractor.js
const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

// Get brightness of a color (0-255)
const getBrightness = (r, g, b) => {
    return (r * 299 + g * 587 + b * 114) / 1000;
};

// Calculate color distance
const colorDistance = (c1, c2) => {
    return Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2)
    );
};

/**
 * Extract dominant colors from an image file
 * @param {File|Blob} imageFile - Image file to analyze
 * @param {number} numColors - Number of colors to extract (default: 5)
 * @returns {Promise<Array>} - Array of {hex, rgb, percentage} objects
 */
export const extractColorsFromImage = (imageFile, numColors = 5) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Scale down for performance
            const maxSize = 100;
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            // Draw and get image data
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            // Count colors with clustering
            const colorCounts = {};
            const clusterThreshold = 30; // Colors within this distance are grouped

            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];

                // Skip transparent pixels
                if (a < 128) continue;

                // Skip very bright (white) and very dark (black) pixels
                const brightness = getBrightness(r, g, b);
                if (brightness > 240 || brightness < 15) continue;

                // Quantize colors for grouping
                const qr = Math.round(r / 10) * 10;
                const qg = Math.round(g / 10) * 10;
                const qb = Math.round(b / 10) * 10;
                const key = `${qr},${qg},${qb}`;

                if (!colorCounts[key]) {
                    colorCounts[key] = { count: 0, r: qr, g: qg, b: qb };
                }
                colorCounts[key].count++;
            }

            // Sort by count and get top colors
            const sortedColors = Object.values(colorCounts)
                .sort((a, b) => b.count - a.count);

            // Filter similar colors
            const filteredColors = [];
            const totalPixels = (canvas.width * canvas.height);

            for (const color of sortedColors) {
                if (filteredColors.length >= numColors) break;

                const isSimilar = filteredColors.some(existing =>
                    colorDistance([color.r, color.g, color.b], [existing.r, existing.g, existing.b]) < clusterThreshold * 2
                );

                if (!isSimilar) {
                    filteredColors.push({
                        hex: rgbToHex(color.r, color.g, color.b),
                        rgb: [color.r, color.g, color.b],
                        percentage: Math.round((color.count / totalPixels) * 100)
                    });
                }
            }

            // Cleanup
            URL.revokeObjectURL(img.src);

            resolve(filteredColors);
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(imageFile);
    });
};

/**
 * Get the most dominant color from an image
 * @param {File|Blob} imageFile - Image file to analyze
 * @returns {Promise<string>} - Hex color string
 */
export const getDominantColor = async (imageFile) => {
    try {
        const colors = await extractColorsFromImage(imageFile, 3);
        return colors.length > 0 ? colors[0].hex : '#000000';
    } catch (error) {
        console.error('Error extracting color:', error);
        return '#000000';
    }
};
