export type CppTemplate = 'menulayer' | 'playlayer' | 'settings';

export type ModSettingType = 'bool' | 'int' | 'float' | 'string';

export interface ModSetting {
    // Using a unique 'id' for React keys, and 'key' for the mod.json key
    id: string; // e.g., a timestamp or UUID for React's key prop
    key: string;
    name: string;
    description: string;
    type: ModSettingType;
    default: boolean | number | string;
}

export interface ModData {
    id: string;
    name: string;
    version: string;
    developer: string;
    description: string;
    logo?: string; // Base64 Data URL for logo.png
    dependencies: string; // comma-separated
    repository: string;
    cppTemplate: CppTemplate;
    includeCi: boolean;
    platforms: {
        win: boolean;
        mac: boolean;
        android: boolean;
        ios: boolean;
    };
    gdVersion: string;
    geodeVersion: string;
    tags: string; // comma-separated
    providesApi: boolean;
    earlyLoad: boolean;
    settings: ModSetting[];
}

export type GeneratedFiles = Record<string, string | undefined>;

export type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};