# Getting Local API Working with Ionic Android App

This document details the steps required to connect an Ionic Android app to a local API server during development, including authentication setup.

## Problem

Android apps have two main issues when connecting to local APIs:
1. Strict network security that blocks HTTP traffic by default
2. Special networking requirements in the emulator that prevent accessing `localhost`
3. Android WebView doesn't properly handle httpOnly session cookies

## Solution

### 1. Configure API Server to Accept External Connections

The API must bind to `0.0.0.0` instead of `localhost` to accept connections from outside the host machine.

**In your API's `.env` file:**
```bash
HOST=0.0.0.0  # Not localhost!
PORT=3333
```

Restart the API server after changing this.

### 2. Set API URL in Ionic App

**For Android Emulator:**
Use the special IP `10.0.2.2` which routes to the host machine's localhost:

```bash
# .env
VITE_API_URL=http://10.0.2.2:3333
```

**For Real Android Device:**
Use your computer's local network IP (both devices must be on same WiFi):

```bash
# .env
VITE_API_URL=http://192.168.1.5:3333
```

To find your IP: `hostname -I | awk '{print $1}'`

### 3. Enable Cleartext Traffic in Android Manifest

Android blocks HTTP traffic by default. You must explicitly allow it.

**Edit `android/app/src/main/AndroidManifest.xml`:**
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true">  <!-- Add this line -->
```

### 4. Configure Capacitor for HTTP

**Edit `capacitor.config.ts`:**
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'your-app',
  webDir: 'dist',
  server: {
    androidScheme: 'http'  // Add this block
  }
};

export default config;
```

### 5. Authentication for Mobile Apps - Two Approaches

Android WebView doesn't properly send httpOnly cookies with requests. There are two solutions:

#### Option A: Basic Auth (Recommended for Simple Apps)

Basic Authentication sends credentials with each request. It's stateless, simple, and works perfectly in mobile apps.

**Backend Implementation:**

1. **Create Basic Auth Middleware:**
```typescript
// app/middleware/basic_auth_middleware.ts
export default class BasicAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return ctx.response.unauthorized({
        message: 'Missing or invalid Authorization header',
      })
    }

    // Extract and decode credentials
    const base64Credentials = authHeader.substring(6)
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [email, password] = credentials.split(':')

    try {
      // Verify credentials against database
      const user = await User.verifyCredentials(email, password)

      // Attach user to context
      (ctx as any).user = user

      return next()
    } catch (error) {
      return ctx.response.unauthorized({ message: 'Invalid credentials' })
    }
  }
}
```

2. **Create Mobile-Only Routes:**
```typescript
// start/routes.ts
router.group(() => {
  router.post('/login', '#controllers/scanner_controller.login')
  router.put('/orders/:id/ship', '#controllers/scanner_controller.shipOrder')
  // ... other routes
}).prefix('/scanner').use([middleware.basicAuth()])
```

**Frontend Implementation:**

```typescript
// services/api.ts
class ApiService {
  private authCredentials: string | null = null

  setCredentials(email: string, password: string) {
    // Store Base64 encoded credentials for Basic Auth
    this.authCredentials = btoa(`${email}:${password}`)
  }

  clearCredentials() {
    this.authCredentials = null
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.authCredentials) {
      headers['Authorization'] = `Basic ${this.authCredentials}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  async login(email: string, password: string) {
    // Set credentials for Basic Auth
    this.setCredentials(email, password)

    // Validate credentials with the server
    try {
      const response = await this.fetch('/scanner/login', {
        method: 'POST',
      })
      return response
    } catch (error) {
      this.clearCredentials()
      throw error
    }
  }

  async logout() {
    this.clearCredentials()
  }
}
```

**Why Basic Auth Works:**
- ✅ Stateless - no server-side session storage needed
- ✅ Simple - credentials verified on each request
- ✅ Works perfectly in Android WebView
- ✅ Secure over HTTPS (credentials encrypted in transit)
- ✅ No cookie issues
- ✅ Easy logout - just clear credentials from memory

**Security Notes:**
- Credentials stored only in memory (cleared on logout)
- MUST use HTTPS in production (encrypts Authorization header)
- Same security as sessions when used over HTTPS
- Password hashing handled by database (User.verifyCredentials)

#### Option B: Session with Custom Header (For Cookie-Based Web Apps)

If you need to maintain httpOnly cookie sessions for web apps but support mobile, use a custom header approach.

**Backend Changes:**

1. **Return session ID in login response:**
```typescript
async login({ request, auth, session }: HttpContext) {
  // ... validation
  await auth.use('web').login(user)
  return { message: 'Logged in', user, sessionId: session.sessionId }
}
```

2. **Accept session ID from header:**
```typescript
// mobile_session_middleware.ts
export default class MobileSessionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const isAuthEndpoint = ctx.request.url().includes('/login')

    if (!isAuthEndpoint) {
      const mobileSessionId = ctx.request.header('X-Session-Id')
      const existingCookie = ctx.request.headers().cookie

      if (mobileSessionId && !existingCookie) {
        const cookieName = 'adonis-session'
        ctx.request.request.headers['cookie'] = `${cookieName}=${mobileSessionId}`
      }
    }

    return next()
  }
}
```

**Frontend Changes:**
```typescript
class ApiService {
  private sessionId: string | null = null

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId
    }

    return fetch(`${API_URL}${endpoint}`, { ...options, headers })
  }

  async login(email: string, password: string) {
    const response = await this.fetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.sessionId = response.sessionId
    return response
  }
}
```

**When to use each approach:**
- **Basic Auth**: Single mobile app, simple auth needs, stateless preferred
- **Session with Header**: Shared API with web apps using cookie sessions, need session features

### 6. Build and Deploy

```bash
npm run build
npx cap sync android
npx cap run android
```

## Checklist

- [ ] API `.env` has `HOST=0.0.0.0`
- [ ] API server restarted
- [ ] Ionic app `.env` has correct API URL (`10.0.2.2` for emulator or real IP for device)
- [ ] `android:usesCleartextTraffic="true"` in AndroidManifest.xml
- [ ] `androidScheme: 'http'` in capacitor.config.ts
- [ ] Authentication implemented (Basic Auth or Session with Custom Header)
- [ ] Rebuilt and synced: `npm run build && npx cap sync android`

## Common Issues and Solutions

### Issue 1: 401 Unauthorized After Login

**Symptom:** Login succeeds (200 OK) but subsequent API calls return 401.

**Cause:** Authentication not being sent properly.

**Solution for Basic Auth:**
- Verify credentials are being set: `this.setCredentials(email, password)`
- Check Authorization header is being added to requests
- Ensure middleware is applied to protected routes

**Solution for Session Auth:**
- Implement custom header authentication
- Check session ID is being sent with requests

### Issue 2: CORS Errors

**Symptom:** Network requests failing with CORS policy errors.

**Solution:** Ensure CORS is properly configured in API:

```typescript
// config/cors.ts
const corsConfig = defineConfig({
  enabled: true,
  origin: true,  // Accept all origins in development
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  credentials: true,
  maxAge: 90,
})
```

### Issue 3: Login Works in Browser, Fails on Device

**Possible causes:**
1. Wrong API URL (check 10.0.2.2 for emulator vs real IP for device)
2. Cleartext traffic not enabled
3. API server not binding to 0.0.0.0
4. Firewall blocking port 3333

**Debugging steps:**
```bash
# Verify API is accessible
# On device browser: http://10.0.2.2:3333

# Check API listening on all interfaces
netstat -tuln | grep 3333
# Should show 0.0.0.0:3333, not 127.0.0.1:3333
```

## Debugging Tools

### Chrome DevTools for Android

1. Open Chrome browser
2. Navigate to `chrome://inspect`
3. Your Android app should appear under "Remote Target"
4. Click "inspect" to see console logs, network requests, etc.

**This is essential for debugging** - you can see all console.log output and network errors.

### API Request Logging

Add middleware to log all requests:

```typescript
// logger_middleware.ts
export default class LoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const start = Date.now()
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12)

    console.log(`[${timestamp}] → ${ctx.request.method()} ${ctx.request.url()}`)

    await next()

    const duration = Date.now() - start
    const endTimestamp = new Date().toISOString().split('T')[1].slice(0, 12)
    console.log(`[${endTimestamp}] ← ${ctx.response.getStatus()} (${duration}ms)`)
  }
}
```

## Production Note

For production builds:
- Use HTTPS for all API communication
- Remove `usesCleartextTraffic` from manifest
- For Basic Auth: HTTPS encrypts credentials in transit
- For Session Auth: Set `secure: true` in session config
- Never commit .env files with production URLs
- Consider certificate pinning for maximum security
