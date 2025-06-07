---
applyTo: "backend/src/utils/gptTaskGenerator.ts,backend/src/routes/tasks.ts,**/*task*"
---

# GPT Task System Development Guidelines

Apply these guidelines when working with the GPT task generation system.

## GPT Task System Best Practices

### Task Generation Flow
- Check for existing daily tasks before generating new ones
- Gather comprehensive user context (focus, stats, family, history)
- Use OpenAI GPT-4 for intelligent task generation
- Implement fallback mock generation for API failures
- Save generated tasks to database with proper relationships

### API Integration
- Use environment variables for OpenAI API configuration
- Implement proper error handling for API calls
- Use structured prompts with clear instructions
- Parse and validate GPT responses before saving
- Handle rate limiting and API errors gracefully

### Database Schema
- Link tasks to focus areas, family members, and stats
- Store task completion feedback for learning
- Track task history for pattern analysis
- Use proper foreign key relationships
- Index frequently queried fields

### Task Completion System
- Capture user feedback on task completion
- Store emotional responses and effectiveness ratings
- Use feedback for future task generation improvements
- Update related stats and progress tracking
- Handle partial completion scenarios

### Context Building
- Gather user's current focus areas and priorities
- Include family member information for relationship tasks
- Consider user's emotional state and recent feedback
- Factor in completion history and patterns
- Use seasonal and temporal context when relevant

### Error Handling
- Gracefully handle OpenAI API failures
- Provide meaningful error messages to users
- Log errors with sufficient context for debugging
- Implement retry logic for transient failures
- Fall back to pre-defined task templates when needed

### Performance Optimization
- Cache frequently accessed user context
- Batch database operations when possible
- Optimize GPT prompts for efficiency
- Use async/await patterns consistently
- Monitor API usage and costs

Reference the GPT task system documentation file for detailed implementation information.
