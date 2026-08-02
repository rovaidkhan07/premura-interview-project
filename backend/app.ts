import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vapiRoutes from './routes/vapiRoutes';
import callRoutes from './routes/callRoutes';
import customerRoutes from './routes/customerRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import historyRoutes from './routes/historyRoutes';
import { requestLogger, logger } from './middlewares/logger';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Modular REST API Routes
app.use('/api/vapi', vapiRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/history', historyRoutes);

// Fallback for single customer endpoint expected by specification
app.use('/api/customer', customerRoutes);

const PORT = process.env.PORT || 3001;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`AI Voice Agent Backend Server running on port ${PORT}`);
  });
}

export default app;