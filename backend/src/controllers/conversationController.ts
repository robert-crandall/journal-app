import { Context } from 'hono';
import { db } from '../db';
import { conversations, messages, userContext } from '../db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { ConversationInput, MessageInput, UserContextInput, ApiResponse, Conversation, Message } from '../types/api';
import { generateChatCompletion } from '../utils/openaiUtils';

// Get all conversations for the current user
export async function getConversations(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    const results = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, currentUser.id))
      .orderBy(desc(conversations.updatedAt));
    
    const response: ApiResponse<{ conversations: Conversation[] }> = {
      success: true,
      data: {
        conversations: results.map((conv: any) => ({
          ...conv,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
        })),
      },
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Get conversations error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve conversations' });
  }
}

// Get a conversation by ID with messages
export async function getConversationById(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const conversationId = c.req.param('id');
    
    // Get conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (conversation.length === 0) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }
    
    // Get messages for this conversation
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
    
    const response: ApiResponse<{ conversation: Conversation }> = {
      success: true,
      data: {
        conversation: {
          ...conversation[0],
          createdAt: conversation[0].createdAt.toISOString(),
          updatedAt: conversation[0].updatedAt.toISOString(),
          messages: conversationMessages.map((msg: any) => ({
            ...msg,
            createdAt: msg.createdAt.toISOString(),
          })),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get conversation error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve conversation' });
  }
}

// Create a new conversation
export async function createConversation(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as ConversationInput;
    
    const result = await db.insert(conversations).values({
      userId: currentUser.id,
      title: body.title || null,
    }).returning();
    
    const conversation = result[0];
    
    const response: ApiResponse<{ conversation: Conversation }> = {
      success: true,
      data: {
        conversation: {
          ...conversation,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
        },
      },
    };
    
    return c.json(response, 201);
  } catch (error) {
    console.error('Create conversation error:', error);
    throw new HTTPException(500, { message: 'Failed to create conversation' });
  }
}

// Add a message to a conversation
export async function sendMessage(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as MessageInput;
    
    // Check if conversation exists and belongs to user
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, body.conversationId),
          eq(conversations.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingConversation.length === 0) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }
    
    // Insert user message
    const userMessageResult = await db.insert(messages).values({
      conversationId: body.conversationId,
      content: body.content,
      role: 'user',
    }).returning();
    
    // Update conversation lastUpdated
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, body.conversationId));
    
    // Get conversation history for context
    const conversationHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, body.conversationId))
      .orderBy(asc(messages.createdAt));
    
    // Get user context for additional context
    const userContextData = await db
      .select()
      .from(userContext)
      .where(eq(userContext.userId, currentUser.id));
    
    // Format conversation history for OpenAI
    const formattedHistory = conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Add user context as system message
    let systemMessage = "You are a personal life coach and assistant. Help the user achieve their goals and reflect on their experiences.";
    
    if (userContextData.length > 0) {
      systemMessage += " Here is some context about the user:\n";
      userContextData.forEach((ctx: any) => {
        systemMessage += `${ctx.key}: ${ctx.value}\n`;
      });
    }
    
    const systemMessageObj = {
      role: 'system',
      content: systemMessage
    };
    
    // Generate AI response
    const aiResponse = await generateChatCompletion([
      systemMessageObj,
      ...formattedHistory
    ]);
    
    if (!aiResponse) {
      throw new HTTPException(500, { message: 'Failed to generate AI response' });
    }
    
    // Save AI response to database
    const aiMessageResult = await db.insert(messages).values({
      conversationId: body.conversationId,
      content: aiResponse,
      role: 'assistant',
    }).returning();
    
    const response: ApiResponse<{ messages: Message[] }> = {
      success: true,
      data: {
        messages: [
          {
            ...userMessageResult[0],
            createdAt: userMessageResult[0].createdAt.toISOString(),
          },
          {
            ...aiMessageResult[0],
            createdAt: aiMessageResult[0].createdAt.toISOString(),
          },
        ],
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Send message error:', error);
    throw new HTTPException(500, { message: 'Failed to send message' });
  }
}

// Update conversation title
export async function updateConversation(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const conversationId = c.req.param('id');
    const body = await c.req.json() as ConversationInput;
    
    // Check if conversation exists and belongs to user
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingConversation.length === 0) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }
    
    const result = await db.update(conversations)
      .set({
        title: body.title || null,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();
    
    const conversation = result[0];
    
    const response: ApiResponse<{ conversation: Conversation }> = {
      success: true,
      data: {
        conversation: {
          ...conversation,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update conversation error:', error);
    throw new HTTPException(500, { message: 'Failed to update conversation' });
  }
}

// Delete a conversation
export async function deleteConversation(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const conversationId = c.req.param('id');
    
    // Check if conversation exists and belongs to user
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingConversation.length === 0) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }
    
    // Delete conversation (cascade will handle messages)
    await db.delete(conversations).where(eq(conversations.id, conversationId));
    
    return c.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete conversation error:', error);
    throw new HTTPException(500, { message: 'Failed to delete conversation' });
  }
}

// Manage user context for AI (key-value store)
export async function getUserContext(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    const results = await db
      .select()
      .from(userContext)
      .where(eq(userContext.userId, currentUser.id));
    
    const response: ApiResponse<{ context: Record<string, string> }> = {
      success: true,
      data: {
        context: results.reduce((acc: Record<string, string>, item: any) => {
          acc[item.key] = item.value;
          return acc;
        }, {}),
      },
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Get user context error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve user context' });
  }
}

// Set a user context key-value pair
export async function setUserContext(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as UserContextInput;
    
    // Check if key already exists
    const existingContext = await db
      .select()
      .from(userContext)
      .where(
        and(
          eq(userContext.userId, currentUser.id),
          eq(userContext.key, body.key)
        )
      )
      .limit(1);
    
    if (existingContext.length > 0) {
      // Update existing context
      await db.update(userContext)
        .set({
          value: body.value,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userContext.userId, currentUser.id),
            eq(userContext.key, body.key)
          )
        );
    } else {
      // Create new context
      await db.insert(userContext).values({
        userId: currentUser.id,
        key: body.key,
        value: body.value,
      });
    }
    
    return c.json({
      success: true,
      message: 'User context updated successfully',
    });
  } catch (error) {
    console.error('Set user context error:', error);
    throw new HTTPException(500, { message: 'Failed to update user context' });
  }
}

// Delete a user context key-value pair
export async function deleteUserContext(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const key = c.req.param('key');
    
    await db.delete(userContext)
      .where(
        and(
          eq(userContext.userId, currentUser.id),
          eq(userContext.key, key)
        )
      );
    
    return c.json({
      success: true,
      message: 'User context deleted successfully',
    });
  } catch (error) {
    console.error('Delete user context error:', error);
    throw new HTTPException(500, { message: 'Failed to delete user context' });
  }
}
