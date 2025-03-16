import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { File, SortOption, FilterOption, DirectoryResult, SortField, SortOrder } from '../models/file.model';
import { environment } from '../../environments/environment';

const GET_DIRECTORY_LISTING = gql`
  query GetDirectoryListing(
    $path: String!, 
    $skip: Int!, 
    $limit: Int!, 
    $sortBy: SortInput, 
    $filter: FilterInput
  ) {
    directoryListing(
      dirPath: $path, 
      skip: $skip, 
      limit: $limit, 
      sortBy: $sortBy, 
      filter: $filter
    ) {
      items {
        name
        path
        size
        isDirectory
        createdAt
        permissions
        extension
      }
      totalCount
      error
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {
  constructor(private apollo: Apollo) {}

  private convertSortOption(sort?: SortOption): { field: string; order: string } | undefined {
    if (!sort) return undefined;
    
    return {
      field: sort.field,
      order: sort.order
    };
  }

  getDirectoryListing(
    path: string,
    skip: number,
    limit: number,
    sortBy?: SortOption,
    filter?: FilterOption
  ): Observable<DirectoryResult> {
    const variables = {
      path,
      skip,
      limit,
      sortBy: sortBy ? {
        field: sortBy.field,
        order: sortBy.order
      } : undefined,
      filter
    };
    
    console.log('GraphQL request variables:', JSON.stringify(variables));
    
    return this.apollo
      .query<{
        directoryListing: {
          items: File[];
          totalCount: number;
          error?: string;
        };
      }>({
        query: GET_DIRECTORY_LISTING,
        variables,
        fetchPolicy: 'network-only'
      })
      .pipe(
        map(result => {
          console.log('GraphQL response:', result.data);
          return {
            items: result.data.directoryListing.items,
            totalItems: result.data.directoryListing.totalCount,
            error: result.data.directoryListing.error
          };
        })
      );
  }

  getParentPath(path: string): string {
    // Remove trailing slash if present
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Find the last separator
    const lastSeparatorIndex = path.lastIndexOf('/');
    if (lastSeparatorIndex <= 0) {
      return '/';
    }

    return path.substring(0, lastSeparatorIndex);
  }
} 