import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { authenticateToken } from './services/auth.js';
import { typeDefs, resolvers } from './schemas/index.js';
import db from './config/connection.js';
import cors from 'cors';

const PORT = process.env.PORT || 3001;

// Manually define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const app = express();

const startApolloServer = async () => {
  await server.start();
  await db;

  // Enable CORS
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow frontend URL
      credentials: true, // Allow cookies/auth headers
    })
  );

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(
    '/graphql',
    expressMiddleware(server as any, {
      context: authenticateToken as any,
    })
  );

  // Serve static files correctly
  if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../../client/dist'); // FIXED PATH
    app.use(express.static(clientDistPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`✅ API server running on port ${PORT}!`);
    console.log(`🟢 GraphQL available at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();