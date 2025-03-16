export interface File {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    createdAt: Date;
    permissions: string;
    extension?: string;
}

export enum SortField {
    NAME = 'NAME',
    SIZE = 'SIZE',
    CREATED_AT = 'CREATED_AT',
    EXTENSION = 'EXTENSION',
    IS_DIRECTORY = 'IS_DIRECTORY'
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export interface SortOption {
    field: SortField;
    order: SortOrder;
}

export interface FilterOption {
    nameContains?: string;
    isDirectory?: boolean | null;
    extension?: string;
    minSize?: number;
    maxSize?: number;
}

export interface DirectoryResult {
    items: File[];
    totalItems: number;
    error?: string;
} 