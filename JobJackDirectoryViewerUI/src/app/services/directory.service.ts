import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from '@apollo/client/core';
import { Observable, map } from 'rxjs';
import { File, SortOption, FilterOption, DirectoryResult } from '../models/file.model';
import { environment } from '../../environments/environment';

const GET_DIRECTORY_LISTING = gql`
  query GetDirectoryListing(
    $dirPath: String!, 
    $skip: Int, 
    $limit: Int, 
    $sortBy: SortInput, 
    $filter: FilterInput
  ) {
    directoryListing(
      dirPath: $dirPath, 
      skip: $skip, 
      limit: $limit, 
      sortBy: $sortBy, 
      filter: $filter
    ) {
      items {
        name
        path
        size
        extension
        createdAt
        permissions
        isDirectory
      }
      totalCount
      error
    }
  }
`;

const GET_CACHE_STATS = gql`
  query GetCacheStats {
    cacheStats {
      size
      entries {
        path
        count
        age
      }
    }
  }
`;

const GET_WATCHER_STATS = gql`
  query GetWatcherStats {
    watcherStats {
      count
      paths
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {
  constructor(private apollo: Apollo) {}

  getDirectoryListing(
    path: string, 
    skip: number = 0, 
    limit: number = 20,
    sortBy?: SortOption,
    filter?: FilterOption
  ): Observable<DirectoryResult> {
    return this.apollo
      .watchQuery({
        query: GET_DIRECTORY_LISTING,
        variables: {
          dirPath: path,
          skip,
          limit,
          sortBy,
          filter
        }
      })
      .valueChanges.pipe(
        map((result: any) => ({
          items: result.data.directoryListing.items,
          totalCount: result.data.directoryListing.totalCount,
          error: result.data.directoryListing.error
        }))
      );
  }
  
  getCacheStats(): Observable<any> {
    return this.apollo
      .watchQuery({
        query: GET_CACHE_STATS,
        fetchPolicy: 'network-only' // Always get fresh data
      })
      .valueChanges.pipe(
        map((result: any) => result.data.cacheStats)
      );
  }
  
  getWatcherStats(): Observable<any> {
    return this.apollo
      .watchQuery({
        query: GET_WATCHER_STATS,
        fetchPolicy: 'network-only' // Always get fresh data
      })
      .valueChanges.pipe(
        map((result: any) => result.data.watcherStats)
      );
  }
} 