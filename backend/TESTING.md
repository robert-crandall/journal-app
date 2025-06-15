# Testing Guide for Journal App

This guide explains how to run the test suite for the Journal App backend.

## Prerequisites

- PostgreSQL database installed and running
- A dedicated test database (to avoid polluting development/production data)

## Setup

1. Create a test database in PostgreSQL:
```bash
psql postgres
CREATE DATABASE journal_test;
\q
```

2. Configure your test environment in `.env.test`:
```
DATABASE_URL=postgres://postgres:your_password@localhost:5432/journal_test
PORT=3001
JWT_SECRET=test_secret_key_for_testing_only
OPENAI_API_KEY=your_openai_api_key_or_mock
```

## Running Tests

### Check Test Database Connection

First, verify that your test database connection is working:

```bash
bun run test:db
```

### Run the Journal Test Client

To run the full test suite, which will:
1. Migrate the test database to the latest schema
2. Start the server
3. Run the JournalTestClient against it

```bash
bun run test:client:env
```

This will execute a complete integration test of the backend API, including:
- User registration and authentication
- Quest creation and management
- Journal entry creation and AI analysis
- Character stat and task management
- Experiment creation and completion
- Conversation interactions with the AI assistant

## Understanding Test Output

The test client will output progress and results to the console, with each test section clearly indicated:

- 📝 User registration tests
- 📚 Quest functionality tests
- 📔 Journal functionality tests
- 🏆 Character stats and tasks tests
- 🔬 Experiment tests
- 💬 Conversation tests

Successful tests are marked with ✓, while failures are marked with ✗.

## Debugging Test Failures

If a test fails:
1. Check the error message in the console
2. Verify your database connection and configuration
3. Check that all required environment variables are set
4. Inspect the database state using Drizzle Studio: `bun run db:studio`

## Additional Information

The test client is defined in `src/client/journalTestClient.ts` and demonstrates the proper usage of all API endpoints. It serves as both a test suite and an example of how to use the Journal API client.
