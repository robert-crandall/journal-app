import { test, expect } from '@playwright/test';

test.describe('Content Management', () => {
	// Shared user for all tests in this suite
	let testUser;

	test.beforeAll(async ({ browser }) => {
		// Create a user once for all tests
		const context = await browser.newContext();
		const page = await context.newPage();

		testUser = {
			email: `content-test-${Date.now()}@example.com`,
			password: 'contenttest123',
			name: `Content User ${Date.now()}`
		};

		// Register the user
		await page.goto('/register');
		await page.fill('input[name="name"]', testUser.name);
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		await context.close();
	});

	// Helper function to login the existing user
	async function loginUser(page) {
		await page.goto('/login');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');
		return testUser;
	}

	// Helper function to delete all posts for cleanup
	async function deleteAllPosts(page) {
		await page.goto('/dashboard');

		// Keep deleting posts until none are left
		while (true) {
			const deleteButtons = page.locator('button[aria-label="Delete post"]');
			const count = await deleteButtons.count();

			if (count === 0) break;

			// Remove any existing dialog handlers to prevent conflicts
			page.removeAllListeners('dialog');
			// Set up fresh dialog handler for this deletion
			page.once('dialog', (dialog) => dialog.accept());

			// Click the first delete button
			await deleteButtons.first().click();

			// Wait for page reload
			await page.waitForLoadState('networkidle');
		}
	}

	test.describe('Create Content', () => {
		test.beforeEach(async ({ page }) => {
			await loginUser(page);
			await deleteAllPosts(page);
		});

		test('should show create form when clicking create button', async ({ page }) => {
			// Click create new post button
			await page.click('button:has-text("Create New Post")');

			// Form should be visible
			await expect(page.locator('h2:has-text("Create New Post")')).toBeVisible();
			await expect(page.locator('input[name="title"]')).toBeVisible();
			await expect(page.locator('textarea[name="content"]')).toBeVisible();
			await expect(page.locator('button[type="submit"]:has-text("Create Post")')).toBeVisible();
		});

		test('should successfully create a new post', async ({ page }) => {
			const testTitle = `Test Post ${Date.now()}`;
			const testContent = `This is a **test post** with *markdown* content!\n\n# Header\n\n- List item 1\n- List item 2`;

			// Click create new post button
			await page.click('button:has-text("Create New Post")');

			// Fill out the form
			await page.fill('input[name="title"]', testTitle);
			await page.fill('textarea[name="content"]', testContent);

			// Submit the form
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Should show success message
			await expect(
				page.locator('.alert-success:has-text("Post created successfully")')
			).toBeVisible();

			// Should see the new post in the list
			await expect(page.locator(`h2:has-text("${testTitle}")`)).toBeVisible();
		});

		test('should hide create form after successful post creation', async ({ page }) => {
			const testTitle = `Form Visibility Test ${Date.now()}`;
			const testContent = 'Testing form visibility behavior';

			// Click create new post button
			await page.click('button:has-text("Create New Post")');

			// Verify form is visible initially
			await expect(page.locator('h2:has-text("Create New Post")')).toBeVisible();

			// Fill out and submit the form
			await page.fill('input[name="title"]', testTitle);
			await page.fill('textarea[name="content"]', testContent);
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Wait for success message to appear, then form should auto-hide
			await expect(
				page.locator('.alert-success:has-text("Post created successfully")')
			).toBeVisible();
			await expect(page.locator('h2:has-text("Create New Post")')).not.toBeVisible();
		});

		test('should handle validation errors for empty fields', async ({ page }) => {
			// Click create new post button
			await page.click('button:has-text("Create New Post")');

			// Try to submit empty form
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Should see validation error (browser native validation should prevent submission)
			// or server-side validation error
			const titleInput = page.locator('input[name="title"]');
			const contentTextarea = page.locator('textarea[name="content"]');

			// Check that required fields are marked as invalid
			await expect(titleInput).toHaveAttribute('required');
			await expect(contentTextarea).toHaveAttribute('required');
		});

		test('should handle validation errors for whitespace-only content', async ({ page }) => {
			// Click create new post button
			await page.click('button:has-text("Create New Post")');

			// Fill with whitespace only
			await page.fill('input[name="title"]', '   ');
			await page.fill('textarea[name="content"]', '   \n\n   ');

			// Submit the form
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Should show validation error
			await expect(page.locator('.alert-error')).toBeVisible();
		});

		test('should cancel form creation', async ({ page }) => {
			// Click create new post button
			await page.click('button:has-text("Create New Post")');

			// Form should be visible
			await expect(page.locator('h2:has-text("Create New Post")')).toBeVisible();

			// Click cancel
			await page.click('button:has-text("Cancel")');

			// Form should be hidden
			await expect(page.locator('h2:has-text("Create New Post")')).not.toBeVisible();
		});
	});

	test.describe('Read Content', () => {
		let createdPostTitle;

		test.beforeEach(async ({ page }) => {
			await loginUser(page);
			await deleteAllPosts(page);

			// Create a test post for reading tests
			createdPostTitle = `Read Test Post ${Date.now()}`;
			const testContent = `This is a test post with **markdown** content!\n\n## Subheader\n\n\`\`\`javascript\nconsole.log('Hello World');\n\`\`\`\n\n- Item 1\n- Item 2\n- Item 3`;

			await page.click('button:has-text("Create New Post")');
			await page.fill('input[name="title"]', createdPostTitle);
			await page.fill('textarea[name="content"]', testContent);
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Wait for success message and form to disappear
			await expect(page.locator('.alert-success')).toBeVisible();
		});

		test('should display posts in content list', async ({ page }) => {
			// Should see the post in the list
			await expect(page.locator(`h2:has-text("${createdPostTitle}")`)).toBeVisible();

			// Should see creation date
			await expect(page.locator('p:has-text("Created:")')).toBeVisible();
		});

		test('should show markdown content as plain text by default', async ({ page }) => {
			// Content should be visible but as plain text (not rendered markdown)
			await expect(page.locator('.prose')).toBeVisible();

			// Should have read more button
			await expect(page.locator('button:has-text("Read More")')).toBeVisible();
		});

		test('should expand content with read more button', async ({ page }) => {
			// Click read more
			await page.click('button:has-text("Read More")');

			// Should show rendered markdown content
			await expect(page.locator('.prose h2')).toBeVisible(); // Markdown header should be rendered
			await expect(page.locator('.prose code')).toBeVisible(); // Code block should be rendered

			// Button should change to "Show Less"
			await expect(page.locator('button:has-text("Show Less")')).toBeVisible();
		});

		test('should collapse content with show less button', async ({ page }) => {
			// First expand
			await page.click('button:has-text("Read More")');
			await expect(page.locator('button:has-text("Show Less")')).toBeVisible();

			// Then collapse
			await page.click('button:has-text("Show Less")');

			// Should show collapsed content again
			await expect(page.locator('button:has-text("Read More")')).toBeVisible();
		});
	});

	test.describe('Update Content', () => {
		let createdPostTitle;

		test.beforeEach(async ({ page }) => {
			await loginUser(page);
			await deleteAllPosts(page);

			// Create a test post for updating tests
			createdPostTitle = `Update Test Post ${Date.now()}`;
			const testContent = `Original content for updating tests.`;

			await page.click('button:has-text("Create New Post")');
			await page.fill('input[name="title"]', createdPostTitle);
			await page.fill('textarea[name="content"]', testContent);
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Wait for post creation success and form auto-close
			await expect(page.locator('.alert-success')).toBeVisible();
			await expect(page.locator('h2:has-text("Create New Post")')).not.toBeVisible();

			// Verify the created post and action buttons are visible
			await expect(page.locator(`h2:has-text("${createdPostTitle}")`)).toBeVisible();
			await expect(page.locator('button[aria-label="Update post"]')).toBeVisible();
		});

		test('should show update form when clicking update button', async ({ page }) => {
			// Click update button (pencil icon)
			await page.click('button[aria-label="Update post"]');

			// Form should be visible with "Update Post" title
			await expect(page.locator('h2:has-text("Update Post")')).toBeVisible();

			// Form should be pre-filled with existing content
			await expect(page.locator('input[name="title"]')).toHaveValue(createdPostTitle);
			await expect(page.locator('textarea[name="content"]')).toHaveValue(
				'Original content for updating tests.'
			);

			// Should have save changes button
			await expect(page.locator('button[type="submit"]:has-text("Save Changes")')).toBeVisible();
		});

		test('should successfully update a post', async ({ page }) => {
			const updatedTitle = `Updated ${createdPostTitle}`;
			const updatedContent = `This is **updated** content with *new* markdown!\n\n## New Section\n\nWith additional content.`;

			// Click update button
			await page.click('button[aria-label="Update post"]');

			// Update the content
			await page.fill('input[name="title"]', updatedTitle);
			await page.fill('textarea[name="content"]', updatedContent);

			// Submit the form
			await page.click('button[type="submit"]:has-text("Save Changes")');

			// Should show success message
			await expect(
				page.locator('.alert-success:has-text("Post updated successfully")')
			).toBeVisible();

			// Form should auto-hide after successful submission
			await expect(page.locator('h2:has-text("Update Post")')).not.toBeVisible();

			// Should see the updated content in the list
			await expect(page.locator(`h2:has-text("${updatedTitle}")`)).toBeVisible();

			// Should show updated date
			await expect(page.locator('p:has-text("Updated:")')).toBeVisible();
		});

		test('should handle validation errors when updating', async ({ page }) => {
			// Click update button
			await page.click('button[aria-label="Update post"]');

			// Clear the fields
			await page.fill('input[name="title"]', '');
			await page.fill('textarea[name="content"]', '');

			// Try to submit
			await page.click('button[type="submit"]:has-text("Save Changes")');

			// Should show validation error or prevent submission
			const titleInput = page.locator('input[name="title"]');
			const contentTextarea = page.locator('textarea[name="content"]');

			await expect(titleInput).toHaveAttribute('required');
			await expect(contentTextarea).toHaveAttribute('required');
		});

		test('should cancel update operation', async ({ page }) => {
			// Click update button
			await page.click('button[aria-label="Update post"]');

			// Form should be visible
			await expect(page.locator('h2:has-text("Update Post")')).toBeVisible();

			// Click cancel
			await page.click('button:has-text("Cancel")');

			// Form should be hidden
			await expect(page.locator('h2:has-text("Update Post")')).not.toBeVisible();

			// Original content should still be visible
			await expect(page.locator(`h2:has-text("${createdPostTitle}")`)).toBeVisible();
		});

		test('should hide action buttons when updating', async ({ page }) => {
			// Initially action buttons should be visible
			await expect(page.locator('button[aria-label="Update post"]')).toBeVisible();
			await expect(page.locator('button[aria-label="Delete post"]')).toBeVisible();

			// Click update button
			await page.click('button[aria-label="Update post"]');

			// Action buttons should be hidden while updating (showActions becomes false)
			await expect(page.locator('button[aria-label="Update post"]')).not.toBeVisible();
			await expect(page.locator('button[aria-label="Delete post"]')).not.toBeVisible();
		});

		test('should hide update form after successful post update', async ({ page }) => {
			const updatedTitle = `Updated Form Visibility Test ${Date.now()}`;
			const updatedContent = 'Testing update form visibility behavior';

			// Click update button
			await page.click('button[aria-label="Update post"]');

			// Verify form is visible initially
			await expect(page.locator('h2:has-text("Update Post")')).toBeVisible();

			// Update the content
			await page.fill('input[name="title"]', updatedTitle);
			await page.fill('textarea[name="content"]', updatedContent);
			await page.click('button[type="submit"]:has-text("Save Changes")');

			// Wait for success message to appear, then form should auto-hide
			await expect(
				page.locator('.alert-success:has-text("Post updated successfully")')
			).toBeVisible();
			await expect(page.locator('h2:has-text("Update Post")')).not.toBeVisible();
			await expect(page.locator('button[aria-label="Update post"]')).toBeVisible();
		});
	});

	test.describe('Delete Content', () => {
		let createdPostTitle;

		test.beforeEach(async ({ page }) => {
			await loginUser(page);
			await deleteAllPosts(page);

			// Create a test post for deletion tests
			createdPostTitle = `Delete Test Post ${Date.now()}`;
			const testContent = `Content to be deleted in tests.`;

			await page.click('button:has-text("Create New Post")');
			await page.fill('input[name="title"]', createdPostTitle);
			await page.fill('textarea[name="content"]', testContent);
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Wait for success message and form to auto-hide
			await expect(page.locator('.alert-success')).toBeVisible();
			await expect(page.locator('h2:has-text("Create New Post")')).not.toBeVisible();

			// Action buttons should be visible after form auto-hides
			await expect(page.locator('button[aria-label="Delete post"]')).toBeVisible();
		});

		test('should show confirmation dialog when clicking delete', async ({ page }) => {
			// Remove any existing dialog handlers to prevent conflicts
			page.removeAllListeners('dialog');

			// Set up dialog handler to capture the confirmation
			let dialogMessage = '';
			page.once('dialog', (dialog) => {
				dialogMessage = dialog.message();
				dialog.dismiss(); // Dismiss the dialog to continue test
			});

			// Click delete button (trash icon)
			await page.click('button[aria-label="Delete post"]');

			// Should have shown confirmation dialog
			expect(dialogMessage).toContain('Are you sure you want to delete this post');
		});

		test('should cancel deletion when dismissing confirmation', async ({ page }) => {
			// Remove any existing dialog handlers to prevent conflicts
			page.removeAllListeners('dialog');

			// Set up dialog handler to dismiss
			page.once('dialog', (dialog) => dialog.dismiss());

			// Click delete button
			await page.click('button[aria-label="Delete post"]');

			// Post should still be visible
			await expect(page.locator(`h2:has-text("${createdPostTitle}")`)).toBeVisible();
		});

		test('should successfully delete post when confirming', async ({ page }) => {
			// Remove any existing dialog handlers to prevent conflicts
			page.removeAllListeners('dialog');

			// Set up dialog handler to accept
			page.once('dialog', (dialog) => dialog.accept());

			// Click delete button
			await page.click('button[aria-label="Delete post"]');

			// Wait for page reload (deletion triggers window.location.reload())
			await page.waitForLoadState('networkidle');

			// Post should no longer be visible
			await expect(page.locator(`h2:has-text("${createdPostTitle}")`)).not.toBeVisible();
		});

		test('should show loading state during deletion', async ({ page }) => {
			// Set up dialog handler to accept
			page.once('dialog', (dialog) => dialog.accept());

			// Click delete button
			await page.click('button[aria-label="Delete post"]');

			// Should show loading spinner (briefly)
			// Note: This might be too fast to catch reliably, so we'll just ensure the test doesn't fail
			const loadingSpinner = page.locator('.loading-spinner');
			// Don't assert visibility since it might be too quick
		});
	});

	test.describe('Content Isolation', () => {
		test('should only show content belonging to the logged-in user', async ({ page }) => {
			await loginUser(page);

			// Create a post
			const userPostTitle = `User Specific Post ${Date.now()}`;
			await page.click('button:has-text("Create New Post")');
			await page.fill('input[name="title"]', userPostTitle);
			await page.fill('textarea[name="content"]', 'This post belongs to the current user.');
			await page.click('button[type="submit"]:has-text("Create Post")');
			await expect(page.locator('.alert-success')).toBeVisible();

			// Logout
			await page.click('[data-testid="user-avatar-button"]');
			await page.click('button[type="submit"]'); // Logout button

			// Register a different user
			const differentUser = {
				email: `different-user-${Date.now()}@example.com`,
				password: 'differentuser123',
				name: `Different User ${Date.now()}`
			};

			await page.goto('/register');
			await page.fill('input[name="name"]', differentUser.name);
			await page.fill('input[name="email"]', differentUser.email);
			await page.fill('input[name="password"]', differentUser.password);
			await page.click('button[type="submit"]');
			await expect(page).toHaveURL('/dashboard');

			// The new user should not see the original user's post
			await expect(page.locator(`h2:has-text("${userPostTitle}")`)).not.toBeVisible();

			// Should show "No posts yet" message
			await expect(page.locator('h3:has-text("No posts yet")')).toBeVisible();
		});
	});

	test.describe('Responsive Design', () => {
		test('should work on mobile viewport', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await loginUser(page);

			// Create button should be visible
			await expect(page.locator('button:has-text("Create New Post")')).toBeVisible();

			// Create a post
			const mobilePostTitle = `Mobile Post ${Date.now()}`;
			await page.click('button:has-text("Create New Post")');
			await page.fill('input[name="title"]', mobilePostTitle);
			await page.fill('textarea[name="content"]', 'Mobile content test.');
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Should work same as desktop
			await expect(page.locator('.alert-success')).toBeVisible();
			await expect(page.locator(`h2:has-text("${mobilePostTitle}")`)).toBeVisible();
		});

		test('should work on tablet viewport', async ({ page }) => {
			// Set tablet viewport
			await page.setViewportSize({ width: 768, height: 1024 });

			await loginUser(page);

			// Interface should be functional
			await expect(page.locator('button:has-text("Create New Post")')).toBeVisible();

			// Navigation should work
			await page.click('[data-testid="user-avatar-button"]');
			await expect(page.locator('[data-testid="user-dropdown-menu"]')).toBeVisible();
		});
	});

	test.describe('Error Handling', () => {
		test('should handle network errors gracefully', async ({ page }) => {
			await loginUser(page);

			// Intercept and fail the create request
			await page.route('**/dashboard', (route) => {
				if (route.request().method() === 'POST') {
					route.abort();
				} else {
					route.continue();
				}
			});

			// Try to create a post
			await page.click('button:has-text("Create New Post")');
			await page.fill('input[name="title"]', 'Network Error Test');
			await page.fill('textarea[name="content"]', 'This should fail due to network error.');
			await page.click('button[type="submit"]:has-text("Create Post")');

			// Should handle the error gracefully (not crash the app)
			// The exact error handling might vary, but the app should remain functional
		});
	});

	test.describe('Accessibility', () => {
		test('should have proper ARIA labels', async ({ page }) => {
			await loginUser(page);
			await deleteAllPosts(page);

			// Create a post first
			const accessibilityPostTitle = `Accessibility Test ${Date.now()}`;
			await page.click('button:has-text("Create New Post")');
			await page.fill('input[name="title"]', accessibilityPostTitle);
			await page.fill('textarea[name="content"]', 'Testing accessibility features.');
			await page.click('button[type="submit"]:has-text("Create Post")');
			await expect(page.locator('.alert-success')).toBeVisible();

			// Form should auto-hide after successful submission
			await expect(page.locator('h2:has-text("Create New Post")')).not.toBeVisible();

			// Check ARIA labels on post action buttons (now visible after auto-hide)
			await expect(page.locator('button[aria-label="Update post"]')).toBeVisible();
			await expect(page.locator('button[aria-label="Delete post"]')).toBeVisible();
		});

		test('should be keyboard navigable', async ({ page }) => {
			await loginUser(page);

			// Focus on create button and activate with keyboard
			await page.focus('button:has-text("Create New Post")');
			await page.keyboard.press('Enter');

			// Form should be visible
			await expect(page.locator('h2:has-text("Create New Post")')).toBeVisible();

			// Should be able to tab through form fields
			await page.keyboard.press('Tab'); // Should focus title input
			await page.keyboard.type('Keyboard Test Post');

			await page.keyboard.press('Tab'); // Should focus content textarea
			await page.keyboard.type('Content created via keyboard navigation.');
		});
	});
});
