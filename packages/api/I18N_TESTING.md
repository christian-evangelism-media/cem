# Testing i18n Translation

The i18n package is now installed and configured. Validation errors will automatically be translated based on the `Accept-Language` HTTP header.

## How It Works

1. **Automatic Detection**: The middleware reads the `Accept-Language` header from each request
2. **Best Match**: It finds the best supported locale (en, es, fr, etc.)
3. **Auto Translation**: Validation errors are automatically translated

## Testing with cURL

### English (default)
```bash
curl -X POST http://localhost:3333/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{"email": "invalid"}'
```

Expected response:
```json
{
  "errors": [
    {
      "message": "The email address must be a valid email address",
      "field": "email"
    }
  ]
}
```

### Spanish
```bash
curl -X POST http://localhost:3333/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: es" \
  -d '{"email": "invalid"}'
```

Expected response:
```json
{
  "errors": [
    {
      "message": "El correo electrónico debe ser una dirección de correo válida",
      "field": "email"
    }
  ]
}
```

### French
```bash
curl -X POST http://localhost:3333/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: fr" \
  -d '{"email": "invalid"}'
```

Expected response:
```json
{
  "errors": [
    {
      "message": "Le adresse e-mail doit être une adresse e-mail valide",
      "field": "email"
    }
  ]
}
```

## Using i18n for Custom Error Messages

In any controller, you can now use:

```typescript
export default class SomeController {
  async someMethod({ i18n, response }: HttpContext) {
    // Translate error messages
    return response.status(404).json({
      message: i18n.t('errors.media.not_found')
    })
  }
}
```

## Languages with Translation Files

**ALL 30 LANGUAGES FULLY TRANSLATED! ✓**

Both `validator.json` and `errors.json` completed for all languages:

1. English (en) ✓
2. Spanish (es) ✓
3. French (fr) ✓
4. German (de) ✓
5. Portuguese (pt) ✓
6. Italian (it) ✓
7. Chinese Simplified (zh) ✓
8. Arabic (ar) ✓
9. Russian (ru) ✓
10. Japanese (ja) ✓
11. Korean (ko) ✓
12. Dutch (nl) ✓
13. Polish (pl) ✓
14. Turkish (tr) ✓
15. Vietnamese (vi) ✓
16. Thai (th) ✓
17. Indonesian (id) ✓
18. Hebrew (he) ✓
19. Czech (cs) ✓
20. Greek (el) ✓
21. Romanian (ro) ✓
22. Hungarian (hu) ✓
23. Swedish (sv) ✓
24. Finnish (fi) ✓
25. Danish (da) ✓
26. Norwegian (no) ✓
27. Ukrainian (uk) ✓
28. Hindi (hi) ✓
29. Bengali (bn) ✓
30. Urdu (ur) ✓

**Total files:** 60 (30 languages × 2 files each)

All locales configured in `config/i18n.ts` with full support.

## Frontend Integration

Your React frontends (cem-web, cem-ops, cem-admin) should send the user's language preference in the `Accept-Language` header:

```typescript
// In your api.ts service
const headers = {
  'Accept-Language': i18n.language, // From i18next
  // ... other headers
}
```

This way, validation errors from the API will match the user's selected language in the frontend.
