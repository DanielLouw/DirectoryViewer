import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClientOptions, InMemoryCache } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { provideHttpClient, withInterceptorsFromDi, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  // Ensure API URL has trailing slash
  const apiUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;
  
  // Log the API URL for debugging
  console.log('Configuring Apollo with API URL:', apiUrl);
  
  // Set up basic headers - CORS headers should be handled by the server
  const headers = new HttpHeaders()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json');
  
  return {
    link: httpLink.create({ 
      uri: apiUrl,
      headers: headers,
      withCredentials: false,
      method: 'POST'
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
    Apollo
  ]
};
