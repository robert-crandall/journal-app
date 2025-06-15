import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, errorMiddleware } from '../middleware/auth';

// Import controllers
import * as authController from '../controllers/authController';
import * as questController from '../controllers/questController';
import * as journalController from '../controllers/journalController';
import * as taskController from '../controllers/taskController';
import * as characterStatController from '../controllers/characterStatController';
import * as experimentController from '../controllers/experimentController';
import * as conversationController from '../controllers/conversationController';

// Import validation schemas
import * as schemas from '../utils/validationSchemas';

// Create router with base prefix
export const apiRoutes = new Hono()
  // Add error handling middleware to all routes
  .use('*', errorMiddleware);

// Auth routes (no auth required)
apiRoutes.post('/auth/register', zValidator('json', schemas.userRegisterSchema), authController.register);
apiRoutes.post('/auth/login', zValidator('json', schemas.userLoginSchema), authController.login);

// Protected routes
// User
apiRoutes.get('/me', authMiddleware, authController.me);

// Quests
apiRoutes.get('/quests', authMiddleware, questController.getQuests);
apiRoutes.get('/quests/:id', authMiddleware, questController.getQuestById);
apiRoutes.post('/quests', authMiddleware, zValidator('json', schemas.questSchema), questController.createQuest);
apiRoutes.put('/quests/:id', authMiddleware, zValidator('json', schemas.questSchema), questController.updateQuest);
apiRoutes.post('/quests/:id/complete', authMiddleware, questController.completeQuest);
apiRoutes.delete('/quests/:id', authMiddleware, questController.deleteQuest);

// Quest milestones
apiRoutes.post('/quest-milestones', authMiddleware, zValidator('json', schemas.questMilestoneSchema), questController.createQuestMilestone);
apiRoutes.post('/quest-milestones/:id/complete', authMiddleware, questController.completeMilestone);

// Journal entries
apiRoutes.get('/journal', authMiddleware, journalController.getJournalEntries);
apiRoutes.get('/journal/:id', authMiddleware, journalController.getJournalEntryById);
apiRoutes.post('/journal', authMiddleware, zValidator('json', schemas.journalEntrySchema), journalController.createJournalEntry);
apiRoutes.put('/journal/:id', authMiddleware, zValidator('json', schemas.journalEntrySchema), journalController.updateJournalEntry);
apiRoutes.delete('/journal/:id', authMiddleware, journalController.deleteJournalEntry);
apiRoutes.post('/journal/analyze', authMiddleware, zValidator('json', schemas.journalAnalysisSchema), journalController.analyzeJournalEntry);

// Tasks
apiRoutes.get('/tasks', authMiddleware, taskController.getTasks);
apiRoutes.get('/tasks/:id', authMiddleware, taskController.getTaskById);
apiRoutes.post('/tasks', authMiddleware, zValidator('json', schemas.taskSchema), taskController.createTask);
apiRoutes.put('/tasks/:id', authMiddleware, zValidator('json', schemas.taskSchema), taskController.updateTask);
apiRoutes.post('/tasks/:id/complete', authMiddleware, taskController.completeTask);
apiRoutes.delete('/tasks/:id', authMiddleware, taskController.deleteTask);

// Character Stats
apiRoutes.get('/character-stats', authMiddleware, characterStatController.getCharacterStats);
apiRoutes.get('/character-stats/:id', authMiddleware, characterStatController.getCharacterStatById);
apiRoutes.post('/character-stats', authMiddleware, zValidator('json', schemas.characterStatSchema), characterStatController.createCharacterStat);
apiRoutes.put('/character-stats/:id', authMiddleware, zValidator('json', schemas.characterStatSchema), characterStatController.updateCharacterStat);
apiRoutes.delete('/character-stats/:id', authMiddleware, characterStatController.deleteCharacterStat);

// Experiments
apiRoutes.get('/experiments', authMiddleware, experimentController.getExperiments);
apiRoutes.get('/experiments/:id', authMiddleware, experimentController.getExperimentById);
apiRoutes.post('/experiments', authMiddleware, zValidator('json', schemas.experimentSchema), experimentController.createExperiment);
apiRoutes.put('/experiments/:id', authMiddleware, zValidator('json', schemas.experimentSchema), experimentController.updateExperiment);
apiRoutes.post('/experiments/:id/complete', authMiddleware, experimentController.completeExperiment);
apiRoutes.delete('/experiments/:id', authMiddleware, experimentController.deleteExperiment);

// Conversations with AI assistant
apiRoutes.get('/conversations', authMiddleware, conversationController.getConversations);
apiRoutes.get('/conversations/:id', authMiddleware, conversationController.getConversationById);
apiRoutes.post('/conversations', authMiddleware, zValidator('json', schemas.conversationSchema), conversationController.createConversation);
apiRoutes.put('/conversations/:id', authMiddleware, zValidator('json', schemas.conversationSchema), conversationController.updateConversation);
apiRoutes.delete('/conversations/:id', authMiddleware, conversationController.deleteConversation);
apiRoutes.post('/conversations/message', authMiddleware, zValidator('json', schemas.messageSchema), conversationController.sendMessage);

// User context for AI
apiRoutes.get('/user-context', authMiddleware, conversationController.getUserContext);
apiRoutes.post('/user-context', authMiddleware, zValidator('json', schemas.userContextSchema), conversationController.setUserContext);
apiRoutes.delete('/user-context/:key', authMiddleware, conversationController.deleteUserContext);
