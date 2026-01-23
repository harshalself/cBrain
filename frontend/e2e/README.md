# 🎭 Playwright E2E Testing Demo

Welcome to your first browser testing experience! This demo will show you how easy it is to test your cBrain app with Playwright.

## 📁 What Was Created

```
frontend/
├── playwright.config.ts          # Playwright configuration
├── e2e/
│   ├── demo-login.spec.ts       # Demo test file (4 tests)
│   └── screenshots/             # Auto-generated screenshots
└── package.json                 # New test scripts added
```

## 🚀 How to Run the Demo

### Prerequisites
1. **Backend must be running** on port 8000
2. **Create a test user** with these credentials:
   - Email: `admin@cbrain.com`
   - Password: `Admin@123`
   - You can do this via the signup page or backend directly

### Run the Tests

```bash
# Terminal 1: Start the backend (if not already running)
cd backend
npm run dev

# Terminal 2: Run Playwright tests
cd frontend
npm run test:e2e
```

## 🎬 What Happens When You Run Tests

1. **Playwright starts your frontend dev server** (on port 5173)
2. **Opens a Chrome browser** (invisible by default)
3. **Runs 4 tests**:
   - ✅ Test 1: Checks if signin page loads
   - ✅ Test 2: Logs in with valid credentials
   - ✅ Test 3: Rejects invalid credentials
   - ✅ Test 4: Verifies user name appears after login
4. **Takes screenshots** on failures or when specified
5. **Generates an HTML report** you can view

## 📊 View Results

After tests run, you'll see:
```
Running 4 tests...
✓ should display signin page (2.3s)
✓ should login successfully with valid credentials (3.1s)
✓ should show error with invalid credentials (1.8s)
✓ should display user name after login (3.2s)

4 passed (10s)
```

To see a detailed HTML report:
```bash
npm run test:e2e:report
```

## 🐛 Debug Mode (Interactive)

Want to see what's happening? Run in UI mode:

```bash
npm run test:e2e:ui
```

This opens a cool interface where you can:
- ⏯️ Step through tests one line at a time
- 👀 Watch the browser in real-time
- 🔍 Inspect each step
- 📸 See screenshots at each point

## 🎯 Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:ui` | Run in UI mode (visual) |
| `npm run test:e2e:debug` | Debug mode with inspector |
| `npm run test:e2e:report` | View last test report |

## 📸 Screenshots

Screenshots are automatically saved to:
- `e2e/screenshots/` - Manual screenshots from tests
- `test-results/` - Failure screenshots (auto-generated)

## 🧑‍💻 Understanding the Test File

Open `e2e/demo-login.spec.ts` to see the test code. It's **heavily commented** to explain each line!

```typescript
// Example from the test:
test('should login successfully', async ({ page }) => {
  // 1. Navigate to page
  await page.goto('/signin');
  
  // 2. Fill the form
  await page.fill('input[type="email"]', 'admin@cbrain.com');
  await page.fill('input[type="password"]', 'Admin@123');
  
  // 3. Click submit
  await page.click('button[type="submit"]');
  
  // 4. Verify redirect
  await page.waitForURL(/.*admin/);
  
  // 5. Take screenshot
  await page.screenshot({ path: 'e2e/screenshots/dashboard.png' });
});
```

## 🎓 What You Learned

1. **Playwright is easy** - Just navigate, click, fill, and assert
2. **Tests are readable** - Anyone can understand what's being tested
3. **Auto-screenshots** - Visual proof of what happened
4. **Debug mode** - Step through tests visually
5. **Real browser** - Tests actual user experience

## 🚀 Next Steps

Now that you see how easy it is, you can:

1. **Modify the demo test** - Change credentials, add more assertions
2. **Create new tests** - Test document upload, chat, etc.
3. **Run on CI** - Playwright works great in GitHub Actions
4. **Add more browsers** - Test in Firefox, Safari, etc.

## 💡 Tips

- Tests run **fast** (10-20 seconds for these 4 tests)
- Use **`test.only()`** to run just one test while developing
- Use **`page.pause()`** to stop and inspect the browser mid-test
- Check the **HTML report** for visual timeline of what happened

## ❓ Need Help?

- The demo test file has **tons of comments**
- Playwright docs: https://playwright.dev
- Ask me to create more tests for specific features!

---

**Ready to see it in action?** Just run:
```bash
npm run test:e2e:ui
```
