export const serverConfig = {
    port: process.env.PORT || 4000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
}; 