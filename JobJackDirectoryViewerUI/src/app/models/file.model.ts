export interface File {
    name: string;
    path: string;
    size: number;
    extension?: string;
    createdAt: string;
    permissions: string;
    isDirectory: boolean;
}

export enum SortField {
    NAME = 'NAME',
    SIZE = 'SIZE',
    CREATED_AT = 'CREATED_AT',
    EXTENSION = 'EXTENSION',
    IS_DIRECTORY = 'IS_DIRECTORY'
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC'
}

export interface SortOption {
    field: SortField;
    order: SortOrder;
}

export interface FilterOption {
    nameContains?: string;
    isDirectory?: boolean;
    minSize?: number;
    maxSize?: number;
    extension?: string;
}

export interface DirectoryResult {
    items: File[];
    totalCount: number;
    error?: string;
} 