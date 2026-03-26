/**
 * Location Utilities for RideMart
 */

/**
 * Get current browser coordinates
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
};

/**
 * Reverse geocode coordinates to get city name
 * In a real app, use Google Maps API or OpenCage
 * For this project, we'll provide a placeholder or use a free service if possible.
 */
export const getCityFromCoords = async (lat, lng) => {
    try {
        // Example using a free reverse geocoding API (BigDataCloud or similar)
        // or just mock it for the college project if no key is wanted.
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        return data.city || data.locality || data.principalSubdivision;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};
