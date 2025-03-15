import { gql } from 'apollo-server';

export const typeDefs = gql`
  type Query {
    directoryListing(
      dirPath: String!, 
      skip: Int, 
      limit: Int, 
      sortBy: SortInput, 
      filter: FilterInput
    ): DirectoryResult
    cacheStats: CacheStats
    watcherStats: WatcherStats
  }

  input SortInput {
    field: SortField!
    order: SortOrder!
  }

  enum SortField {
    NAME
    SIZE
    CREATED_AT
    EXTENSION
    IS_DIRECTORY
  }

  enum SortOrder {
    ASC
    DESC
  }

  input FilterInput {
    nameContains: String
    isDirectory: Boolean
    minSize: Float
    maxSize: Float
    extension: String
  }

  type DirectoryResult {
    items: [File]!
    totalCount: Int!
    error: String
  }

  type File {
    name: String!
    path: String!
    size: Float!
    extension: String
    createdAt: String!
    permissions: String!
    isDirectory: Boolean!
  }
  
  type CacheEntry {
    path: String!
    count: Int!
    age: Int!
  }
  
  type CacheStats {
    size: Int!
    entries: [CacheEntry!]!
  }
  
  type WatcherStats {
    count: Int!
    paths: [String!]!
  }
`; 