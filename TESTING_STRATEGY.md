# Testing Strategy - Armstrong Immo-Wallet

## Overview

This document outlines the testing strategy for the Armstrong platform, covering unit tests, integration tests, E2E tests, and manual testing procedures.

## Test Structure

```
town-square-platform/
├── src/
│   ├── test/                      # Unit tests
│   │   ├── setup.ts              # Test configuration
│   │   ├── demoDataSystem.test.ts
│   │   ├── manifestDrivenRoutes.test.ts
│   │   └── engines/              # Business logic tests
│   ├── engines/                   # Calculation engines with tests
│   └── components/                # Components (add .test.tsx files)
├── e2e/                           # E2E tests (Playwright)
└── spec/                          # Additional test specs
```

## Testing Tools

- **Unit Tests**: Vitest + Testing Library
- **E2E Tests**: Playwright
- **Linting**: ESLint + TypeScript
- **Type Checking**: TypeScript strict mode

## Running Tests

### All Tests
```bash
npm run test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### E2E Tests
```bash
npx playwright test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Current Test Coverage

### Unit Tests (94 tests, 87 passing)
- ✅ Demo Data System (89 tests)
- ✅ Manifest-Driven Routes (95 tests)
- ✅ Business Logic Engines
  - Tax calculations
  - Provision calculations
  - Financing calculations

### Known Test Failures (to be fixed)
1. **Golden Path Registry count mismatch** (expected 15, got 17)
   - Two new processes added: GP-PET and GP-ZUHAUSE
   - Tests need updating to reflect new processes
   
2. **Demo ID duplicate detection**
   - One duplicate ID in demo data registry
   - Needs investigation and cleanup

3. **MOD-18 tile count mismatch**
   - Expected 8 tiles, got 9
   - New tile added to Finanzen module

## Test Categories

### 1. Unit Tests

Unit tests verify individual components and functions in isolation.

#### Business Logic (Engines)
Test calculation engines thoroughly:

```typescript
// Example: src/engines/tax/test/taxCalculator.test.ts
describe('Tax Calculator', () => {
  it('calculates Spekulationssteuer correctly', () => {
    const result = calculateSpeculationTax({
      purchasePrice: 300000,
      salePrice: 400000,
      holdingPeriod: 8, // years
    });
    expect(result.taxAmount).toBe(0); // No tax after 10 years
  });
});
```

#### Component Tests
```typescript
// Example: src/components/Button.test.tsx
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### 2. Integration Tests

Integration tests verify multiple components working together.

```typescript
// Example: src/test/integration/financeFlow.test.ts
describe('Finance Request Flow', () => {
  it('creates finance request with property', async () => {
    // 1. Create property
    const property = await createProperty({...});
    
    // 2. Create finance request
    const request = await createFinanceRequest({
      propertyId: property.id,
      amount: 500000,
    });
    
    // 3. Verify
    expect(request.propertyId).toBe(property.id);
    expect(request.status).toBe('draft');
  });
});
```

### 3. E2E Tests (Playwright)

E2E tests verify complete user workflows in a real browser.

#### Critical User Journeys

**Journey 1: New User Onboarding**
```typescript
// e2e/onboarding.spec.ts
test('new user can sign up and explore platform', async ({ page }) => {
  // 1. Sign up
  await page.goto('/');
  await page.click('text=Registrieren');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'SecurePass123!');
  await page.click('button:has-text("Account erstellen")');
  
  // 2. Verify dashboard loads
  await expect(page).toHaveURL('/portal');
  await expect(page.locator('h1')).toContainText('Dashboard');
  
  // 3. Explore modules
  await page.click('text=Immobilien');
  await expect(page).toHaveURL(/\/portal\/immobilien/);
});
```

**Journey 2: Create Property and Finance Request**
```typescript
test('user can create property and request financing', async ({ page }) => {
  // 1. Login
  await loginAsTestUser(page);
  
  // 2. Create property
  await page.click('text=Immobilien');
  await page.click('text=Neue Immobilie');
  await page.fill('[name=street]', 'Musterstraße 1');
  await page.fill('[name=city]', 'Berlin');
  await page.fill('[name=price]', '500000');
  await page.click('button:has-text("Speichern")');
  
  // 3. Create finance request
  await page.click('text=Finanzierung anfragen');
  await page.fill('[name=amount]', '400000');
  await page.click('button:has-text("Anfrage erstellen")');
  
  // 4. Verify
  await expect(page.locator('.toast')).toContainText('Erfolgreich');
});
```

**Journey 3: Upload and Manage Documents**
```typescript
test('user can upload documents to DMS', async ({ page }) => {
  await loginAsTestUser(page);
  
  await page.click('text=Dokumente');
  await page.setInputFiles('[type=file]', 'test-files/sample.pdf');
  
  await expect(page.locator('.document-list')).toContainText('sample.pdf');
});
```

### 4. Manual Testing

Manual testing is required for:
- UI/UX evaluation
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility
- Edge cases not covered by automated tests

#### Manual Test Checklist

**Desktop Browsers** (test on each):
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

**Mobile Devices**:
- [ ] iOS Safari (iPhone)
- [ ] Android Chrome
- [ ] Tablet (iPad/Android)

**Functionality**:
- [ ] All navigation works
- [ ] Forms validate correctly
- [ ] Buttons trigger correct actions
- [ ] Data persists after reload
- [ ] Logout works correctly

**Responsive Design**:
- [ ] Layout adapts to screen size
- [ ] No horizontal scrolling
- [ ] Touch targets are large enough (min 44x44px)
- [ ] Text is readable (min 16px)

**Accessibility**:
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Focus indicators visible
- [ ] Alt text for images

**Performance**:
- [ ] Page load < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks (check DevTools)

## Test Data Management

### Demo Data
- Demo data is controlled via `src/data/demoIDs.ts`
- Demo data can be toggled on/off per process
- Use `ALL_DEMO_IDS` constant to identify demo entities

### Test Users
Create test users in Supabase for E2E tests:

```sql
-- Create test user
INSERT INTO auth.users (email, encrypted_password)
VALUES ('test@example.com', crypt('TestPass123!', gen_salt('bf')));

-- Create test tenant
INSERT INTO tenants (name, owner_id)
VALUES ('Test Organization', (SELECT id FROM auth.users WHERE email = 'test@example.com'));
```

### Fixtures
Store test fixtures in `spec/fixtures/`:

```typescript
// spec/fixtures/properties.ts
export const mockProperty = {
  id: 'test-id-123',
  street: 'Teststraße 1',
  city: 'Berlin',
  price: 500000,
  // ... more fields
};
```

## Continuous Integration (CI)

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run unit tests
        run: npm run test
      
      - name: Build
        run: npm run build
  
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Testing Best Practices

### DO ✅
- Write tests for all business logic
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests independent (no shared state)
- Mock external dependencies (Supabase, APIs)
- Use test fixtures for consistent data
- Run tests before committing
- Maintain test coverage > 80% for critical paths

### DON'T ❌
- Test implementation details (test behavior, not code)
- Write flaky tests (random failures)
- Depend on external services in unit tests
- Skip writing tests for "simple" code
- Use sleep/wait instead of proper async handling
- Ignore failing tests
- Commit code without running tests

## Test Writing Guidelines

### Test Structure (AAA Pattern)
```typescript
test('descriptive test name', () => {
  // Arrange: Set up test data
  const input = { amount: 100, rate: 0.05 };
  
  // Act: Execute the code under test
  const result = calculateInterest(input);
  
  // Assert: Verify the outcome
  expect(result).toBe(5);
});
```

### Naming Conventions
- Test files: `*.test.ts` or `*.spec.ts`
- Test descriptions: Should read like sentences
  - ✅ `'calculates tax correctly for short holding period'`
  - ❌ `'tax calc test 1'`

### Async Testing
```typescript
test('fetches user data', async () => {
  const data = await fetchUser('123');
  expect(data.id).toBe('123');
});
```

## Coverage Goals

### Current Coverage
- Unit Tests: ~60% (estimated)
- Integration Tests: ~20% (estimated)
- E2E Tests: ~30% of critical paths

### Target Coverage (by Release)
- Unit Tests: > 80% for business logic
- Integration Tests: > 50% for data flows
- E2E Tests: 100% of critical user journeys

## Priority Test Areas

### High Priority (Must Test)
1. **Authentication & Authorization**
   - Login/Logout
   - Token refresh
   - Multi-tenant isolation
   - RLS policies

2. **Data Integrity**
   - CRUD operations
   - Data validation
   - Database constraints
   - Transaction handling

3. **Critical Business Logic**
   - Financial calculations
   - Tax calculations
   - Provision calculations
   - Price calculations

### Medium Priority (Should Test)
4. **User Workflows**
   - Property management
   - Document uploads
   - Finance requests
   - Project management

5. **UI Components**
   - Form validation
   - Error handling
   - Loading states
   - Responsive design

### Low Priority (Nice to Test)
6. **Edge Cases**
   - Offline mode
   - Very large datasets
   - Unusual browser configurations
   - Internationalization

## Monitoring & Reporting

### Test Reports
- Unit test results: Console output
- E2E test results: `playwright-report/` directory
- Coverage reports: Generate with `vitest --coverage`

### Metrics to Track
- Test execution time
- Test failure rate
- Code coverage percentage
- E2E test pass rate
- Time to fix failing tests

## Future Improvements

### Planned Testing Enhancements
- [ ] Increase unit test coverage to 80%
- [ ] Add visual regression testing (Percy, Chromatic)
- [ ] Implement mutation testing (Stryker)
- [ ] Add performance testing (Lighthouse CI)
- [ ] Set up automatic screenshot comparison
- [ ] Add API contract testing
- [ ] Implement chaos engineering tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Kent C. Dodds: Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Version History

- **2026-02-18**: Initial testing strategy for beta phase
