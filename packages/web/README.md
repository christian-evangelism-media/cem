# CEM Web

Public-facing web application for the Christian Evangelism Media (CEM) platform, where users can browse, filter, and order evangelism materials in 30 languages.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **TailwindCSS v4** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **TanStack Query** - Data fetching and caching
- **i18next** - Internationalization (30 languages)
- **React Router** - Client-side routing
- **Mapbox** - Address autocomplete

## Features

- **Multi-Language Support**
  - UI available in 30 languages
  - Automatic language detection from browser
  - Language preference system (affects media ordering)
  - Localized content for all UI elements

- **Media Browsing**
  - Browse Christian evangelism materials (tracts, gospels, answers)
  - Filter by language with manual/automatic modes
  - View digital and press-ready PDFs
  - Dynamic pagination based on screen height
  - Responsive design with dark mode support

- **Shopping Cart & Orders**
  - Add items to cart with quantity selection
  - Place orders for free materials
  - View order history with status tracking

- **User Management**
  - User registration with email verification
  - Login/logout functionality
  - Profile management
  - Address management with autocomplete
  - Language preference settings

## Prerequisites

- Node.js 20+
- npm or yarn
- Running instance of [cem-api](https://github.com/christian-evangelism-media/cem-api)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/christian-evangelism-media/cem-web.git
   cd cem-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure the following:
   ```env
   # API URL (cem-api backend)
   VITE_API_URL=http://localhost:3333

   # Mapbox API token (for address autocomplete)
   VITE_MAPBOX_TOKEN=pk.YOUR_MAPBOX_PUBLIC_TOKEN_HERE
   ```

   > **Note:** Get a free Mapbox token at https://account.mapbox.com/access-tokens/

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

The build output will be in the `dist` directory.

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── AddressAutocomplete.tsx
│   ├── AddressForm.tsx
│   ├── CartModal.tsx
│   ├── LanguagePreferences.tsx
│   └── LanguageSwitcher.tsx
├── contexts/          # React contexts
│   └── UserContext.tsx
├── hooks/             # Custom React hooks
│   ├── useAddressQueries.ts
│   ├── useCartQueries.ts
│   ├── useMediaQueries.ts
│   └── useOrderQueries.ts
├── i18n/              # Internationalization
│   ├── config.ts
│   └── locales/       # Translation files (30 languages)
├── pages/             # Page components
│   ├── Addresses.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Media.tsx
│   ├── Orders.tsx
│   └── Register.tsx
├── services/          # API service layer
│   └── api.ts
└── App.tsx            # Main app component
```

## Features Detail

### Language System

The application supports 30 languages with automatic detection:

1. **UI Language Switcher** - Changes the entire interface language
2. **Language Preferences** - Set preferred languages for media
3. **Language Filter** - Filter media by specific languages

Media matching user preferences appears first in listings.

### Media Display

- Each media item shows multiple language badges
- Separate badges for type (Gospel, Tract, Answers)
- View digital PDF (for screen viewing)
- View press-ready PDF (for printing)
- Visibility indicator for staff users

### Shopping Cart

- Add items with customizable quantities
- Allowed quantities vary by media type (e.g., 1-5 for Gospels, 1-200 for Tracts)
- Persistent cart across sessions
- Quick remove and update quantity

### Address Management

- Multiple saved addresses
- Set default address for orders
- Autocomplete powered by Mapbox
- Optional labels (Home, Work, Church)

## Supported Languages

Arabic, Bengali, German, Greek, English, Spanish, Persian, French, Hausa, Hebrew, Hindi, Haitian Creole, Indonesian, Ilocano, Italian, Japanese, Korean, Marathi, Punjabi, Portuguese, Romanian, Russian, Swahili, Tamil, Telugu, Tagalog, Turkish, Urdu, Vietnamese, Chinese

## Authentication

This application uses session-based authentication with HTTP-only cookies. Credentials are sent to the cem-api backend, which manages sessions.

## License

Dual-licensed under:
- MIT License
- The Unlicense

See LICENSE file for details.
