## 📸 Feature: Photo Upload Support for Journal & Measurements

### **Overview**

Add the ability to attach photos to both **Journal entries** and **Measurements**, with a smooth workflow optimized for iOS Safari (iOS 16+). The goal is to allow either **direct camera capture** or **upload from gallery** using a single reusable component.

Photos should be stored server-side with thumbnails for fast calendar display and lazy-loading of full-resolution images.

---

### **Requirements**

#### 1. Upload Sources

- **Journal entries**:
  - Allow adding 1+ photos per entry.
  - Photos should be linked by `journal_entry_id`.

- **Measurements**:
  - Allow adding 1+ photos per measurement record.
  - Photos should be linked by `measurement_id`.
  - Useful for body composition tracking (front/side/back, etc.).

#### 2. iOS Safari Camera Integration

- Use `<input type="file" accept="image/*" capture="environment">` to:
  - Open the camera directly.
  - Still allow file selection from the gallery.

- Single, reusable component that supports:
  - Take photo
  - Upload photo(s) from gallery
  - Optional: drag-and-drop support (desktop)

#### 3. Storage & Infrastructure

- **Dockerfile**:
  - Add a mounted folder (e.g., `/uploads`) for persistent storage.
  - Ensure proper file permissions inside the container.

- Support both:
  - Original high-res image
  - Generated thumbnail (smaller, optimized for quick UI loading)

- Store file metadata in `photos` table:

  ```sql
  CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linked_type TEXT NOT NULL, -- 'journal' or 'measurement'
    linked_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  ```

#### 4. Thumbnail Generation

- Use server-side image processing (e.g., Sharp for Node.js, or ImageMagick in Docker).
- Generate a \~200px width thumbnail on upload.
- Store both original and thumbnail in `/uploads`.

#### 5. Calendar UI

- Calendar days with a **journal photo** should show:
  - A small thumbnail indicator (maybe lower-right corner).
  - Lazy-load the actual image only when opened.

- Clicking a date opens the journal entry with photos.

#### 6. Lazy Loading

- Use `loading="lazy"` on `<img>` tags.
- Load thumbnails first, then swap in full-res on click/zoom.

---

### **Bonus**

- Drag-and-drop photo upload for desktop users.
- Optional captions for each photo.
- Support multiple photo uploads at once.

---

### **Acceptance Criteria**

- [ ] Journal entries allow photo capture/upload directly from mobile Safari.
- [ ] Measurements allow photo capture/upload directly from mobile Safari.
- [ ] One reusable component handles both camera and gallery input.
- [ ] Photos are stored with both full-res and thumbnail versions.
- [ ] Calendar view shows days with journal photos.
- [ ] Lazy-loading implemented for performance.
