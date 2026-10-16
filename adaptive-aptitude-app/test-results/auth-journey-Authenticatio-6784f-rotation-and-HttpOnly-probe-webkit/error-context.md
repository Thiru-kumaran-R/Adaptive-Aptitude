# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-journey.spec.ts >> Authentication Journey (SEC-01–17 & Same-Origin Auth) >> executes public registration, login, token rotation, and HttpOnly probe
- Location: e2e/auth-journey.spec.ts:5:3

# Error details

```
Error: browserContext.newPage: Target page, context or browser has been closed
Browser logs:

<launching> /Users/rajakumaran/Library/Caches/ms-playwright/webkit-2370/pw_run.sh --inspector-pipe --no-startup-window
<launched> pid=12425
[pid=12425][err] /Users/rajakumaran/Library/Caches/ms-playwright/webkit-2370/pw_run.sh: line 7: 12431 Segmentation fault: 11  DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
```