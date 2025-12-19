import { getCurrentBackendUrl } from '../api';

/**
 * Resolves a relative image URL to an absolute URL based on the current backend.
 * Also transforms direct MinIO URLs to use nginx proxy for better accessibility.
 * @param path The relative path or absolute URL of the image
 */
export const resolveImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;

    // Check if this is a direct MinIO URL that needs to be proxied through nginx
    // MinIO URLs look like: http://100.99.182.57:9000/stsc-documents/vehicles/lexus.jpg
    // We need to transform to: http://100.99.182.57/storage/stsc-documents/vehicles/lexus.jpg
    const minioPattern = /^https?:\/\/[^\/]+:9000\/(.+)$/;
    const minioMatch = path.match(minioPattern);
    
    if (minioMatch) {
        // Extract the path after port 9000
        const minioPath = minioMatch[1];
        const baseUrl = getCurrentBackendUrl();
        
        if (baseUrl && baseUrl !== 'Not detected yet') {
            // Transform: http://100.99.182.57:5000 → http://100.99.182.57
            // Then add /storage/ prefix for nginx proxy
            const hostMatch = baseUrl.match(/^(https?:\/\/[^:\/]+)/);
            if (hostMatch) {
                return `${hostMatch[1]}/storage/${minioPath}`;
            }
        }
        // Fallback: return original URL if we can't transform
        return path;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Handle relative paths
    const baseUrl = getCurrentBackendUrl();

    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // If no base URL detected yet, return undefined (image won't load until we have a backend)
    if (!baseUrl || baseUrl === 'Not detected yet') return undefined;

    return `${baseUrl}/${cleanPath}`;
};
