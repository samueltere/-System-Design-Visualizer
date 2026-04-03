# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> System Design Visualizer >> should load the application
- Location: tests/e2e/app.spec.ts:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('System Design Visualizer')
Expected: visible
Error: strict mode violation: getByText('System Design Visualizer') resolved to 3 elements:
    1) <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">System Design Visualizer</h1> aka getByRole('heading', { name: 'System Design Visualizer', exact: true })
    2) <h2 class="text-2xl font-bold text-gray-800 mb-4">Welcome to System Design Visualizer</h2> aka getByRole('heading', { name: 'Welcome to System Design' })
    3) <div>© 2026 System Design Visualizer</div> aka getByText('© 2026 System Design')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('System Design Visualizer')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "System Design Visualizer" [level=1] [ref=e9]
    - button "Login with Google" [ref=e11]:
      - img [ref=e12]
      - text: Login with Google
  - main [ref=e15]:
    - complementary [ref=e16]:
      - heading "Components" [level=2] [ref=e17]
      - paragraph [ref=e18]: Drag components to the canvas to start designing.
      - generic [ref=e19]:
        - generic [ref=e20]:
          - img [ref=e22]
          - generic [ref=e25]: API Server
        - generic [ref=e26]:
          - img [ref=e28]
          - generic [ref=e32]: Database
        - generic [ref=e33]:
          - img [ref=e35]
          - generic [ref=e37]: Load Balancer
        - generic [ref=e38]:
          - img [ref=e40]
          - generic [ref=e43]: Cache
        - generic [ref=e44]:
          - img [ref=e46]
          - generic [ref=e49]: Client
        - generic [ref=e50]:
          - img [ref=e52]
          - generic [ref=e54]: Frontend
        - generic [ref=e55]:
          - img [ref=e57]
          - generic [ref=e59]: Storage
        - generic [ref=e60]:
          - img [ref=e62]
          - generic [ref=e64]: Message Queue
    - generic [ref=e65]:
      - generic [ref=e67]:
        - heading "Welcome to System Design Visualizer" [level=2] [ref=e68]
        - paragraph [ref=e69]: Sign in to create, save, and collaborate on system architecture diagrams in real-time.
        - button "Get Started" [ref=e70]
      - generic [ref=e72]:
        - generic [ref=e74]:
          - generic:
            - img
        - img [ref=e75]
        - generic [ref=e77]:
          - button "zoom in" [ref=e78] [cursor=pointer]:
            - img [ref=e79]
          - button "zoom out" [ref=e81] [cursor=pointer]:
            - img [ref=e82]
          - button "fit view" [ref=e84] [cursor=pointer]:
            - img [ref=e85]
          - button "toggle interactivity" [ref=e87] [cursor=pointer]:
            - img [ref=e88]
        - img "React Flow mini map" [ref=e91]
        - generic [ref=e92]:
          - generic [ref=e93]:
            - img [ref=e95]
            - heading "Simulation" [level=3] [ref=e98]
          - generic [ref=e99]:
            - generic [ref=e100]:
              - generic [ref=e101]: Requests / Sec
              - slider [ref=e102] [cursor=pointer]: "2"
              - generic [ref=e103]:
                - generic [ref=e104]: 1 RPS
                - generic [ref=e105]: 2 RPS
                - generic [ref=e106]: 10 RPS
            - generic [ref=e107]:
              - generic [ref=e108]: Node Latency (ms)
              - slider [ref=e109] [cursor=pointer]: "500"
              - generic [ref=e110]:
                - generic [ref=e111]: 100ms
                - generic [ref=e112]: 500ms
                - generic [ref=e113]: 2s
            - button "Start Simulation" [ref=e114]
        - generic [ref=e115]:
          - generic [ref=e116]:
            - generic [ref=e117]: Status
            - generic [ref=e120]: Live Sync Active
          - button "Clear Canvas" [ref=e121]
        - link "React Flow attribution" [ref=e123] [cursor=pointer]:
          - /url: https://reactflow.dev
          - text: React Flow
  - contentinfo [ref=e125]:
    - generic [ref=e126]: © 2026 System Design Visualizer
    - generic [ref=e127]:
      - generic [ref=e128]: "Real-time Engine: Socket.io"
      - generic [ref=e129]: "Database: Firestore"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('System Design Visualizer', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |   });
  7  | 
  8  |   test('should load the application', async ({ page }) => {
  9  |     await expect(page).toHaveTitle(/System Design Visualizer/);
> 10 |     await expect(page.getByText('System Design Visualizer')).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  11 |   });
  12 | 
  13 |   test('should show simulation panel', async ({ page }) => {
  14 |     await expect(page.getByRole('heading', { name: 'Simulation' })).toBeVisible();
  15 |     await expect(page.getByRole('button', { name: 'Start Simulation' })).toBeVisible();
  16 |   });
  17 | 
  18 |   test('should show sidebar with components', async ({ page }) => {
  19 |     await expect(page.getByRole('heading', { name: 'Components' })).toBeVisible();
  20 |     await expect(page.getByText('API Server')).toBeVisible();
  21 |     await expect(page.getByText('Database')).toBeVisible();
  22 |   });
  23 | });
  24 | 
```