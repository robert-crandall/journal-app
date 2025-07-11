# User Context Service

The User Context Service provides a comprehensive way to gather all user information needed for GPT prompts in a single, efficient call.

## Features

- **Comprehensive Context**: Retrieves user character info, active goals, family members, character stats, and more in one call
- **Selective Retrieval**: Use options to only fetch specific data types you need
- **GPT-Ready Formatting**: Built-in formatting function for system prompts
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Backwards Compatibility**: Works alongside existing `UserContext` interface

## Basic Usage

```typescript
import { getUserContext, formatUserContextForPrompt } from '../utils/userContextService';

// Get all user context
const context = await getUserContext(userId);

// Format for GPT system prompt
const promptContent = formatUserContextForPrompt(context);
```

## Selective Data Retrieval

```typescript
// Only get character and goals
const context = await getUserContext(userId, {
  includeCharacter: true,
  includeActiveGoals: true,
  includeFamilyMembers: false,
  includeCharacterStats: false,
});

// Get specific items
import { getSpecificUserContext } from '../utils/userContextService';

const activeGoals = await getSpecificUserContext(userId, 'activeGoals');
const familyMembers = await getSpecificUserContext(userId, 'familyMembers');
```

## GPT Integration

### System Prompt Example

```typescript
function createMySystemPrompt(userContext: ComprehensiveUserContext): string {
  return `You are an AI assistant helping ${userContext.name} with their tasks.

${formatUserContextForPrompt(userContext)}

Guidelines:
- Reference their goals and character background when relevant
- Consider family member preferences when suggesting activities
- Be aware of their character stats and suggest activities that might help them level up
`;
}
```

### Conversational Journal Integration

The conversational journal functions have been updated to accept both the legacy `UserContext` and the new `ComprehensiveUserContext`:

```typescript
// Both of these work:
const response1 = await generateFollowUpResponse(conversation, legacyContext);
const response2 = await generateFollowUpResponse(conversation, comprehensiveContext);
```

## Data Structure

The `ComprehensiveUserContext` interface includes:

- **Basic Info**: `name`
- **Character**: `characterClass`, `backstory`, `characterGoals`, `motto`
- **Active Goals**: Array of goal objects with `id`, `title`, `description`
- **Family Members**: Array with relationship details, preferences, connection stats
- **Character Stats**: Array with current levels and XP totals

## Performance Considerations

- The service uses efficient database queries with proper JOINs
- Use selective retrieval options to only fetch data you need
- Results are not cached - cache at the application level if needed for repeated calls
- All queries are scoped to the specific user for security

## Migration from Legacy UserContext

The new service is designed to be backwards compatible. Existing code using `UserContext` will continue to work, and you can gradually migrate to the comprehensive service:

```typescript
// Old way
const legacyContext = await getUserContext(userId); // from journal route helper

// New way
const comprehensiveContext = await getUserContext(userId); // from userContextService

// Convert comprehensive to legacy if needed
const legacyFormat = {
  name: comprehensiveContext.name,
  characterClass: comprehensiveContext.characterClass,
  backstory: comprehensiveContext.backstory,
  goals: comprehensiveContext.characterGoals,
};
```

## Future Expansions

The service is designed to easily accommodate future features:

- Projects and Adventures
- Quests 
- Daily Focuses
- Experiments
- Recent task history
- XP trends and achievements

Simply add new fields to the `ComprehensiveUserContext` interface and corresponding database queries to the service.
