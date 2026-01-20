
// Helper for tile math
export function lat2tile(lat: number, zoom: number) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

export function long2tile(lon: number, zoom: number) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

export function tile2long(x: number, z: number) {
    return (x / Math.pow(2, z) * 360 - 180);
}

export function tile2lat(y: number, z: number) {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

export interface TileCoord {
    x: number;
    y: number;
    z: number;
    url: string;
}

export function getTilesInBounds(
    north: number,
    south: number,
    west: number,
    east: number,
    minZoom: number,
    maxZoom: number
): TileCoord[] {
    const tiles: TileCoord[] = [];

    for (let z = minZoom; z <= maxZoom; z++) {
        const minX = long2tile(west, z);
        const maxX = long2tile(east, z);
        const minY = lat2tile(north, z);
        const maxY = lat2tile(south, z);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                // Replace with your template pattern. We'll pass it in or default to OSM.
                // For now, returning objects 
                const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
                tiles.push({ x, y, z, url });
            }
        }
    }
    return tiles;
}

export function estimateSize(tileCount: number): string {
    // Avg tile ~15-20KB (png)
    const avg = 20 * 1024; // 20KB
    const total = tileCount * avg;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}

export function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
