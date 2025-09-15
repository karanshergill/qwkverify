// swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'My API Docs',
            version: '1.0.0',
            description: 'API documentation for my Node.js project',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local server',
            },
        ],
    },
    apis: ['../'], 
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
