# Git Hooks - Automated Testing

## Description

The project has been configured with automatic Git hooks that run tests before each commit. This ensures that code in the repository always passes all tests.

## Configuration

### Husky
- **Tool**: Husky v9.1.7
- **Configuration file**: `.husky/pre-commit`
- **Function**: Automatic test execution before commit

### Available Hooks

#### 1. Standard Pre-commit Hook
**File**: `.husky/pre-commit`

Runs:
- All React tests (67 tests)
- All backend tests (8 tests)

```bash
# Test hook manually
./.husky/pre-commit
```

#### 2. Lint-staged Hook (alternative)
**File**: `.husky/pre-commit-lint-staged`
**Configuration**: `.lintstagedrc.json`

Runs only for changed files:
- ESLint with automatic fixes
- React and backend tests
- Prettier for JSON/MD files

```bash
# To use lint-staged instead of standard hook:
mv .husky/pre-commit .husky/pre-commit-backup
mv .husky/pre-commit-lint-staged .husky/pre-commit
chmod +x .husky/pre-commit
```

## How it works

1. **Before commit**: Git automatically runs `.husky/pre-commit`
2. **Tests**: All React and backend tests are executed
3. **Success**: If all tests pass ✅ - commit is executed
4. **Error**: If any test fails ❌ - commit is blocked

## Benefits

✅ **Code quality**: Ensures only working code reaches the repository
✅ **Early error detection**: Problems are caught before push
✅ **Time savings**: Prevents CI/CD issues
✅ **Team discipline**: Enforces running tests
✅ **Stable main branch**: main/develop always has working code

## Potential challenges

⚠️ **Commit time**: Commit may take longer (currently ~6 seconds)
⚠️ **Developer frustration**: May block quick commits
⚠️ **Configuration**: Requires proper environment setup

## Workaround (if needed)

```bash
# Skip hooks in exceptional situations (NOT RECOMMENDED)
git commit --no-verify -m "commit message"
```

## Test status

- **React tests**: 67 tests in 5 packages ✅
- **Backend tests**: 8 tests in 1 package ✅
- **Total**: 75 tests ✅

## Recommendations

1. **Use standard hook** for maximum confidence
2. **Consider lint-staged** for larger projects (faster for small changes)
3. **Educate team** about benefits of automated testing
4. **Monitor execution time** and optimize tests if needed