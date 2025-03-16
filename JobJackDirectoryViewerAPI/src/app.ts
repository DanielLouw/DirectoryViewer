import { ApolloServer } from 'apollo-server';
import { GraphQLFormattedError } from 'graphql';
import { typeDefs } from './schema/schema';
import { resolvers } from './resolvers/directory';
import { serverConfig } from './config/server';

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    introspection: true,
    formatError: (error: GraphQLFormattedError): GraphQLFormattedError => {
        console.error('GraphQL Error:', error);
        return error;
    },
    cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'apollo-query-plan-experimental', 'x-apollo-tracing', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers'],
        preflightContinue: false,
        optionsSuccessStatus: 204
    }
});

server.listen(serverConfig.port).then(({ url }: { url: string }) => {
    console.log(`Server ready at ${url}`);
    console.log(`Environment: ${serverConfig.environment}`);
}); 