# Combined Weekly Analysis Feature - Task List

## Overview

Combine journal summary and goal alignment into a single unified weekly analysis that generates both summaries and displays them together with metrics.

## ✅ Tasks

### [x] 1.0 Database Schema & Migration

- [x] 1.1 Create weekly_analyses table for combined summaries
- [x] 1.2 Generate and apply database migration
- [x] 1.3 Update database schema exports

### [x] 2.0 Backend API & Types

- [x] 2.1 Create weekly-analyses route with CRUD endpoints
- [x] 2.2 Implement unified generation endpoint that creates both journal and goal alignment summaries
- [x] 2.3 Create GPT service for combined analysis generation
- [x] 2.4 Export all necessary types for frontend
- [x] 2.5 Add metrics calculation service for XP and task statistics

### [ ] 3.0 Backend Integration Tests

- [ ] 3.1 Write tests for weekly analyses CRUD operations
- [ ] 3.2 Write tests for unified generation endpoint
- [ ] 3.3 Write tests for metrics calculation service
- [ ] 3.4 Ensure all backend tests pass

### [ ] 4.0 Frontend Implementation

- [ ] 4.1 Create API client for weekly analyses
- [ ] 4.2 Create unified weekly analysis page with three sections (Journal Summary, Metrics, Goal Alignment)
- [ ] 4.3 Add "Analyze My Week" action button to trigger generation
- [ ] 4.4 Add loading states and error handling for generation process
- [ ] 4.5 Add navigation links from journal and goals sections
- [ ] 4.6 Display metrics summary (XP gained, tasks completed, etc.)

### [ ] 5.0 Frontend E2E Tests

- [ ] 5.1 Write test for unified weekly analysis generation
- [ ] 5.2 Write test for viewing combined analysis with all three sections
- [ ] 5.3 Write test for navigation from journal and goals sections
- [ ] 5.4 Ensure all frontend tests pass

### [ ] 6.0 Integration & Cleanup

- [ ] 6.1 Run full test suite and ensure all tests pass
- [ ] 6.2 Clean up any temporary files or code
- [ ] 6.3 Test the complete feature end-to-end
