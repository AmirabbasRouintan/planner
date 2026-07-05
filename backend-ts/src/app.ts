import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';

// Import routes
import authRoutes from './routes/auth';
import ticketRoutes from './routes/tickets';
import taskRoutes from './routes/tasks';
import goalRoutes from './routes/goals';
import reportRoutes from './routes/reports';
import submissionRoutes from './routes/submissions';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notifications';
import fileRoutes from './routes/files';
import workingHoursRoutes from './routes/working-hours';
import structureRoutes from './routes/structure';
import boardRoutes from './routes/boards';
import groupRoutes from './routes/groups';
import serviceRoutes from './routes/services';
import telegramRoutes from './routes/telegram';
import adminRoutes from './routes/admin';
import checklistRoutes from './routes/checklist';
import eventTemplateRoutes from './routes/event-templates';
import exerciseRoutes from './routes/exercises';
import noteRoutes from './routes/notes';
import calendarRoutes from './routes/calendar';
import userRoutes from './routes/users';
import googleSheetsRoutes from './routes/google-sheets';

const app = express();

// Middleware
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/working-hours', workingHoursRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/event-templates', eventTemplateRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/users', userRoutes);
app.use('/api/google-sheets', googleSheetsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;
