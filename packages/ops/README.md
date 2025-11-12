# CEM Operations

Operations panel for the Christian Evangelism Media (CEM) platform, providing management tools for users, media, and orders with role-based access control.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **TailwindCSS v4** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **TanStack Query** - Data fetching and caching
- **Luxon** - Date and time handling
- **React Router** - Client-side routing

## Features

- **Dashboard**
  - Statistics overview (total users, orders, media)
  - Recent orders list with user details
  - Quick navigation to management sections

- **User Management**
  - View all users with role indicators
  - Create new users with auto-generated passwords
  - Edit user details (name, email)
  - Change user roles (with permission checks)
  - Role-based UI (features shown/hidden by permissions)

- **Media Management**
  - Create, edit, delete media items
  - Draft system (support creates, admins publish)
  - Multi-language content support
  - Visibility control (published/unpublished)
  - PDF file management
  - Permission-based editing restrictions

- **Order Management**
  - View all orders
  - Update order status
  - View order details and user information

## Prerequisites

- Node.js 20+
- npm or yarn
- Running instance of [cem-api](https://github.com/christian-evangelism-media/cem-api)
- Operations account (admin, super_admin, support, or help role)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/christian-evangelism-media/cem-ops.git
   cd cem-ops
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
   ```

## Development

Start the development server:

```bash
npm run dev
```

The operations panel will be available at `http://localhost:5173`.

## Building for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

The build output will be in the `dist` directory.

## Getting Started

### Creating the First Super Admin

The first super_admin must be created directly in the database. Follow these steps:

1. **Register a user account** on the public website (cem-web) or create one via the API
2. **Connect to your PostgreSQL database**:
   ```bash
   PGPASSWORD=your_password psql -U postgres -d cem
   ```
3. **Promote the user to super_admin**:
   ```sql
   UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
   ```
4. **Verify the change**:
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   ```
5. **Exit PostgreSQL**:
   ```sql
   \q
   ```

You can now log in to the operations panel with this account.

### Creating Additional Admins

Once you have a super_admin account:

1. Log in to the operations panel
2. Go to **Users** section
3. Click **Create User**
4. Fill in the details and select role = **admin**
5. The new admin will receive an email with their temporary password
6. They must verify their email and change their password on first login

## Role-Based Permission System

### Role Hierarchy

1. **super_admin** - Full system access, created via database
2. **admin** - Full service administration, created by super_admin
3. **support** - Customer service & account management, created by admin/super_admin
4. **help** - Warehouse/fulfillment & media draft creation, created by admin/super_admin
5. **user** - Public website only (cannot access operations panel)

### Permission Matrix

| Feature | super_admin | admin | support | help |
|---------|-------------|-------|---------|------|
| **Dashboard** | ✓ | ✓ | ✓ | ✓ |
| **Messages** | ✓ (all) | ✓ (all) | ✓ (all) | ✗ |
| **View Users** | ✓ | ✓ | ✓ (read-only) | ✗ |
| **Create Users** | ✓ | ✓ | ✗ | ✗ |
| **Edit User Details** | ✓ (all) | ✓ (non-admin) | ✓ (users only) | ✗ |
| **Change Roles** | ✓ (all) | ✓ (user↔support↔help) | ✗ | ✗ |
| **View Orders** | ✓ | ✓ | ✓ | ✓ |
| **Update Order Status** | ✓ | ✓ | ✓ | ✓ |
| **View Media** | ✓ (all + drafts) | ✓ (all + drafts) | ✓ (all + drafts) | ✓ (all + drafts) |
| **Create Media** | ✓ | ✓ | ✓ (draft only) | ✓ (draft only) |
| **Edit Media** | ✓ (all) | ✓ (all) | ✓ (own drafts) | ✓ (own drafts) |
| **Delete Media** | ✓ (all) | ✓ (all) | ✓ (own drafts) | ✓ (own drafts) |
| **Publish Media** | ✓ | ✓ | ✗ | ✗ |

### Permission Rules

**User Management:**
- Super_admin can modify anyone's role including promoting to admin
- Admin can manage support/help roles and regular users, but cannot touch other admins
- Support can view and edit regular user accounts (password resets, profile updates)
- Support CANNOT block, delete users, or change roles
- Users cannot modify their own role

**Messages:**
- Users can send messages to request help
- Support/admin/super_admin can view all messages and respond
- Help role cannot access messages (warehouse workers don't handle customer service)

**Media Management:**
- `isVisible` flag controls publication status
- Help can create drafts and edit their own unpublished media
- Only admin/super_admin can publish media (set `isVisible: true`)
- Once published, help cannot edit or delete
- Staff (help/support/admin/super_admin) see draft media with "Draft" badge

**User Creation:**
- Admins can create users via operations panel
- New users receive email with temporary password
- Users must verify email and change password on first login

## Project Structure

```
src/
├── components/        # Reusable UI components
│   └── Layout.tsx     # Main layout with sidebar
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Dashboard.tsx  # Statistics and overview
│   ├── Login.tsx      # Admin login
│   ├── Media.tsx      # Media management
│   ├── Orders.tsx     # Order management
│   └── Users.tsx      # User management
├── services/          # API service layer
│   └── api.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── App.tsx            # Main app component
```

## Features Detail

### Dashboard

- Total counts for users, orders, and media
- Recent orders with quick status view
- Pending orders indicator
- Quick navigation to management pages

### User Management

- Searchable user list
- Role badges with color coding
- Inline role changes (with permission checks)
- Create user modal with role selection
- Edit user details modal
- Cannot modify own role or super_admins

### Media Management

- Table view with name, type, languages, and visibility
- Language badges with full English names
- Visibility toggle (admin/super_admin only)
- Edit/delete buttons (permission-based)
- Draft indicator for unpublished media
- Support can only modify their own drafts

### Order Management

- All orders with user information
- Status badges (pending, processing, shipped, delivered)
- Status update dropdown
- Order items with quantities
- Date formatting with Luxon

## Authentication

This application requires users with `admin`, `super_admin`, `support`, or `help` roles. Regular users are redirected with an error message.

Session-based authentication using HTTP-only cookies managed by cem-api.

## License

Dual-licensed under:
- MIT License
- The Unlicense

See LICENSE file for details.
