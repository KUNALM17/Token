import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import hospitalAdminRoutes from './routes/hospitalAdmin.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import patientRoutes from './routes/patient.routes.js';
import paymentRoutes from './routes/payment.routes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app: Express = express();
export const prisma = new PrismaClient({ errorFormat: 'pretty' });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/super-admin', superAdminRoutes);
app.use('/admin', hospitalAdminRoutes);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/payments', paymentRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log('\n⚠️  Warning: Database connection failed');
    console.log('Error:', (error as Error).message);
    console.log('\n📝 To fix this:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Update DATABASE_URL in backend/.env with correct credentials');
    console.log('3. Run: npm run prisma:migrate');
    console.log('4. Run: npm run prisma:seed');
    console.log('\nStarting server anyway (API will fail without database)...\n');

    app.listen(PORT, () => {
      console.log(`⚠️  Server running on http://localhost:${PORT} (without database)`);
    });
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
  } catch (e) {
    // Database may not be connected
  }
  process.exit(0);
});

export default app;
