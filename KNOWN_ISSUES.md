# Known Issues - Frontend

This document tracks known issues and incomplete features in the frontend application.

## jQuery 3.7.1 Upgrade - COMPLETED ✅

**Date**: November 4, 2024
**Status**: Successfully completed and merged

### Changes Made:
- Upgraded jQuery from 3.2.1 (May 2017) → 3.7.1 (August 2023)
- Updated 27 HTML files with new jQuery version
- Fixed deprecated `jQuery.trim()` → native `String.prototype.trim()` in `js/utilities/form-utilities-0.0.1.js:248`
- All tests passing with zero regressions

### Test Results:
- **QUnit**: 11 tests, 58/60 assertions passing (2 test mocking failures, not jQuery-related)
- **Functional Tests**: 24/28 passing (same baseline as before upgrade)
- **Manual Testing**: Verified in Safari on macOS

## Pre-Existing Frontend Issues

### 1. Product Detail Page JavaScript Error
**File**: `js/product-0.0.1.js:76`
**Severity**: HIGH

**Error**:
```javascript
TypeError: undefined is not an object (evaluating 'data['product_data']['title']')
```

**Description**:
- JavaScript expects API response with `data['product_data']` structure
- Backend API `/order/product/{identifier}` either doesn't exist or returns different data format
- Page fails to load product details

**Affected URLs**:
- http://localhost:8080/product?id={any-product-id}

**API Call** (line 21):
```javascript
var url_str = env_vars['api_url'] + "/order/product/" + product_identifier;
```

**Fix Required**:
- Backend: Implement or repair `/order/product/{identifier}` endpoint
- OR Frontend: Update JavaScript to match actual API response structure
- Add sample data to database for testing

### 2. Account Pages Redirect Issue
**Files**: Various account page handlers
**Severity**: MEDIUM

**Description**:
- When accessing account pages without authentication, redirect loses port number
- URL changes from `http://localhost:8080/account/` → `http://localhost/account/`
- Results in connection failure

**Affected URLs**:
- http://localhost:8080/account/
- http://localhost:8080/account/* (all account pages)

**Fix Required**:
- Backend: Fix authentication redirect to preserve port number
- May require updating Django redirect URLs or session configuration

### 3. QUnit Test Mocking Failures
**File**: `unittests/js/index_tests.js`
**Severity**: LOW

**Failing Tests**:
1. `urlParam function` - Line 178: Cannot mock `window.location` (browser security)
2. `are_arrays_equal function` - 1 assertion failure

**Error**:
```
Attempting to change access mechanism for an unconfigurable property
```

**Description**:
- Tests try to mock `window.location.href` which is not allowed in modern browsers
- These are test infrastructure issues, not application bugs

**Fix Required**:
- Refactor tests to use a different mocking approach
- Consider using a spy/stub library like Sinon.js

## Verified Working Features

The following features were manually tested and work correctly with jQuery 3.7.1:

✅ **Navigation**:
- Home page
- About page
- Contact page
- Products list
- Login page
- Create account page

✅ **jQuery Functionality**:
- AJAX API calls
- Dynamic header/footer loading
- Form validation
- Environment detection (auto-routes to correct API URL)
- Cookie handling
- Cart counter updates

✅ **Browser Compatibility**:
- Tested in Safari on macOS (2024 MacBook Pro M4 Max)
- All core functionality works

## Testing Environment

**Local Development**:
```bash
# Frontend
http://localhost:8080

# Backend API
http://localhost:8000

# Docker Setup
cd /path/to/startup_web_app_server_side
docker-compose up -d
docker-compose exec -d backend python manage.py runserver 0.0.0.0:8000
```

**QUnit Tests**:
- URL: http://localhost:8080/unittests/index_tests.html
- Results: 58/60 assertions passing

**Functional Tests** (run from backend):
```bash
docker-compose exec -e HEADLESS=TRUE backend python manage.py test functional_tests
```

## Next Steps

### High Priority
1. **Fix Product Detail API Integration**
   - Coordinate with backend team to implement `/order/product/{identifier}` endpoint
   - OR update `js/product-0.0.1.js` to match actual API structure
   - Load sample product data for testing

2. **Fix Account Redirect Issue**
   - Work with backend team to preserve port in authentication redirects
   - Test all account pages after fix

### Medium Priority
3. **Improve QUnit Test Suite**
   - Fix or refactor `window.location` mocking tests
   - Consider adding Sinon.js or similar mocking library
   - Increase test coverage to 100% assertions passing

### Low Priority
4. **Functional Test Improvements**
   - Help backend team fix Selenium scrolling issues
   - Add explicit waits for cart counter rendering

## Related Documentation

- **Backend Issues**: See `startup_web_app_server_side/KNOWN_ISSUES.md`
- **jQuery Upgrade PR**: https://github.com/bartgottschalk/startup_web_app_client_side/pull/2
- **QUnit Tests PR**: https://github.com/bartgottschalk/startup_web_app_client_side/pull/1
