# Photo Upload Feature - Task List

## 🎯 Feature Overview
Add photo upload support for Journal entries and Measurements with iOS Safari camera integration, thumbnail generation, and lazy loading.

## 📋 Task Breakdown

### [x] 1. Database Schema & Migration
- [x] Create `photos` table with proper relationships to journals and measurements
- [x] Add foreign key constraints for `journal_id` and `measurement_id`
- [x] Add fields for file paths, thumbnails, and metadata
- [x] Generate and apply database migration

### [x] 2. Backend API & Type Export
- [x] Create photo upload endpoint (`POST /api/photos`)
- [x] Implement file upload handling with multer/formidable
- [x] Add thumbnail generation using Sharp
- [x] Create photo CRUD endpoints (GET, DELETE)
- [x] Add photo validation schemas
- [x] Export all photo-related types for frontend use
- [x] Update journal and measurement endpoints to include photo data

### [ ] 3. Backend Integration Tests
- [ ] Test photo upload endpoint with actual files
- [ ] Test thumbnail generation
- [ ] Test photo deletion and cleanup
- [ ] Test photo retrieval with journal/measurement data
- [ ] Verify file storage and permissions
- [ ] Ensure all backend tests pass (`bun run test`)

### [ ] 4. Frontend Implementation  
- [ ] Create reusable `PhotoUpload.svelte` component
- [ ] Implement camera capture and file selection UI
- [ ] Add drag-and-drop support for desktop
- [ ] Create photo display components with lazy loading
- [ ] Update Journal entry components to include photos
- [ ] Update Measurement components to include photos
- [ ] Add photo deletion functionality
- [ ] Update calendar view to show photo indicators

### [ ] 5. Frontend E2E Tests
- [ ] Test photo upload flow from journal entries
- [ ] Test photo upload flow from measurements  
- [ ] Test camera capture on mobile (simulated)
- [ ] Test photo display and lazy loading
- [ ] Test photo deletion functionality
- [ ] Ensure all E2E tests pass (`bun run test:e2e`)

### [ ] 6. Infrastructure & Docker Updates
- [ ] Update Dockerfile to include Sharp dependencies
- [ ] Add `/uploads` volume mount for persistent storage
- [ ] Configure proper file permissions
- [ ] Add image processing dependencies

### [ ] 7. Integration & Cleanup
- [ ] Run full test suite (`bun run test`)
- [ ] Remove any temporary files or code
- [ ] Update documentation
- [ ] Commit all changes

## 🎯 Current Focus
Ready to start with **Database Schema & Migration** - the first step in our development cycle.
