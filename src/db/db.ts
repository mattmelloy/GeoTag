import Dexie, { type Table } from 'dexie';

export interface Trek {
    id?: number;
    name?: string;
    startTime: number;
    endTime?: number;
    path: [number, number][]; // [[lat, lng]]
    synced: boolean;
}

export interface WebPoint {
    id?: number;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
    notes?: string;
    tags: string[];
    photo?: Blob;
}

export class GeoTrekDB extends Dexie {
    treks!: Table<Trek>;
    points!: Table<WebPoint>;
    tiles!: Table<MapTile>;
    regions!: Table<MapRegion>;

    constructor() {
        super('GeoTrekDB');
        this.version(1).stores({
            treks: '++id, startTime, synced',
            points: '++id, timestamp',
            tiles: 'id', // id is "z-x-y" string
            regions: '++id, name, timestamp'
        });
    }
}

export const db = new GeoTrekDB();

export interface MapRegion {
    id?: number;
    name: string;
    bounds: {
        north: number;
        south: number;
        west: number;
        east: number;
    };
    minZoom: number;
    maxZoom: number;
    tileCount: number;
    sizeBytes: number;
    timestamp: number;
}

export interface MapTile {
    id: string; // "z-x-y"
    blob: Blob;
    timestamp: number;
}
