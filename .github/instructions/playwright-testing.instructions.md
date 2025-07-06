---
description: Playwright E2E testing best practices and patterns for reliable test automation
applyTo: 'e2e/**/*.test.ts'
---

# Playwright Testing Best Practices

## Element Selection Strategy

- **USE `data-testid` attributes for test-specific element targeting**
  - More reliable than CSS classes or text content
  - Immune to styling changes and internationalization
  - Clearly indicates elements intended for testing

  ```typescript
  // ✅ DO: Use data-testid for reliable element selection
  await page.click('[data-testid="user-avatar-button"]');
  await expect(page.locator('[data-testid="user-dropdown-menu"]')).toBeVisible();

  // ❌ DON'T: Use generic CSS classes that match multiple elements
  await expect(page.locator('.dropdown-content')).toBeVisible(); // Strict mode violation!
  ```

- **Scope selectors within components to avoid conflicts**

  ```typescript
  // ✅ DO: Scope selectors within specific components
  await expect(page.locator('[data-testid="user-dropdown-menu"] a[href="/dashboard"]')).toBeVisible();

  // ❌ DON'T: Use global text selectors that match multiple elements
  await expect(page.locator('text=Dashboard')).toBeVisible(); // Matches page title AND link
  ```

## Dialog Handling

- **Always clean up dialog handlers to prevent test interference**

  ```typescript
  // ✅ DO: Remove existing handlers before setting new ones
  page.removeAllListeners('dialog');
  page.once('dialog', (dialog) => dialog.accept());

  // ❌ DON'T: Use persistent handlers that conflict between tests
  page.on('dialog', (dialog) => dialog.accept()); // Can cause "already handled" errors
  ```

## Test Isolation

- **Implement cleanup functions for reliable test isolation**
  ```typescript
  // ✅ DO: Create cleanup functions to prevent test interference
  async function deleteAllPosts(page) {
    await page.goto('/dashboard');
    page.removeAllListeners('dialog');
    // ... cleanup logic
  }
  ```

## Form Testing

- **Test form interactions with proper state management**

  ```typescript
  // ✅ DO: Wait for form state changes and success indicators
  await page.click('button[type="submit"]:has-text("Create Post")');
  await expect(page.locator('.alert-success')).toBeVisible();

  // Close forms properly to see resulting content
  await page.click('button:has-text("Cancel")');
  await expect(page.locator('h2:has-text("Create New Post")')).not.toBeVisible();
  ```

## Selector Best Practices

- **Use semantic element types combined with attributes**

  ```typescript
  // ✅ DO: Combine element type with attributes for specificity
  await page.locator('button[aria-label="Delete post"]').click();
  await page.locator('input[name="title"]').fill('Test Title');

  // ✅ DO: Use role-based selectors for accessibility testing
  await page.getByRole('button', { name: 'Submit' }).click();
  ```

- **Handle multiple matching elements with `.first()` or specific targeting**

  ```typescript
  // ✅ DO: Use .first() when multiple valid elements exist
  await deleteButtons.first().click();

  // ✅ DO: Use specific attributes to target exact elements
  await page.locator(`button[data-post-id="${postId}"]`).click();
  ```

## Common Anti-patterns

- **Avoid generic class selectors in strict mode**
  - `.dropdown-content`, `.modal`, `.card` often match multiple elements
  - Use `data-testid` or scope within specific components

- **Avoid text-based selectors for UI elements**
  - Text content can appear in multiple places (titles, announcements, etc.)
  - Use semantic element selectors with attributes instead

- **Avoid persistent event handlers**
  - `page.on()` handlers persist across actions and can conflict
  - Use `page.once()` and clean up with `removeAllListeners()`

## Test Structure

### Single User Pattern (Preferred)

- **Create one test user in `beforeAll` and reuse across all tests**
- More reliable than creating new users per test
- Prevents cross-test contamination and timing issues

```typescript
// ✅ DO: Single user with state cleanup
test.describe('Feature Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@app.com`,
    password: 'password123',
    name: 'Test User',
  };

  test.beforeAll(async ({ browser }) => {
    // Create single user for all tests
    const page = await browser.newPage();
    await page.goto('/register');
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login with existing user and reset state
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Clean up application state to reset to starting point
    await page.goto('/feature');

    // Delete all existing items using scoped selectors
    while (true) {
      const items = page.locator('.card').filter({ has: page.locator('h3') });
      const count = await items.count();

      if (count === 0) break;

      await items.first().locator('.dropdown .btn:has-text("⋮")').click();
      await items.first().locator('.dropdown .dropdown-content').waitFor({ state: 'visible' });

      page.removeAllListeners('dialog');
      page.once('dialog', (dialog) => dialog.accept());

      await page.click('button[type="submit"]:has-text("Delete")');
      await page.waitForTimeout(100);
    }

    await expect(page.locator('text=No items yet')).toBeVisible();
  });
});

// ❌ DON'T: New user per test
test.beforeEach(async ({ page }) => {
  const testUser = { email: `test-${Date.now()}@app.com`, ... };
  // Creates cross-test contamination and timing issues
});
```

- **Group related tests with descriptive test.describe blocks**

  ```typescript
  test.describe('Content Management', () => {
    test.describe('Create Content', () => {
      // Related creation tests
    });
    test.describe('Edit Content', () => {
      // Related editing tests
    });
  });
  ```

- **Use consistent test data patterns**
  ```typescript
  // ✅ DO: Create predictable test data with timestamps
  const testUser = {
    email: `test-${Date.now()}@journal.com`,
    password: 'testpassword123',
    name: 'Test User',
  };
  ```

## Journals from Codebase

See these files for implementation journals:

- [e2e/content-management.test.ts](mdc:e2e/content-management.test.ts) - Comprehensive CRUD testing with cleanup
- [e2e/responsive.test.ts](mdc:e2e/responsive.test.ts) - Component interaction testing with scoped selectors
- [e2e/auth.test.ts](mdc:e2e/auth.test.ts) - Authentication flow testing
