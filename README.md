# Yahadeen Pharmacy Management System

A comprehensive pharmacy management platform built with modern web and mobile technologies, designed to streamline pharmacy operations and enhance customer experience.

## 🏥 Overview

Yahadeen is a full-featured pharmacy management system that provides three integrated applications:

- **Admin Web Application** - Management dashboard for pharmacy administrators and staff
- **Attendant Mobile App** - Mobile application for pharmacy attendants to manage orders and inventory
- **Customer Mobile App** - Customer-facing mobile application for ordering medications and managing prescriptions

## ✨ Features

### Admin Application
- **Dashboard & Analytics** - Real-time business insights with charts and metrics
- **User Management** - Admin, attendant, and customer account management
- **Product & Inventory Management** - Comprehensive product catalog with stock tracking
- **Order Management** - Order processing, status updates, and fulfillment tracking
- **Category Management** - Organize products into hierarchical categories
- **Inventory Adjustments** - Track stock changes with audit trail
- **Low Stock Alerts** - Automated notifications for inventory management

### Attendant Application
- **Order Processing** - Accept, prepare, and manage customer orders
- **Inventory Access** - Real-time stock availability checking
- **Order Status Updates** - Update order status through fulfillment workflow
- **Shift Management** - Track attendant duty status and schedules
- **Mobile-First Design** - Optimized for in-store use on mobile devices

### Customer Application
- **Product Browsing** - Browse medications by category with search functionality
- **Prescription Upload** - Upload prescription images for verification
- **Order Placement** - Place orders with multiple delivery options
- **Order Tracking** - Real-time order status tracking
- **Address Management** - Save and manage delivery addresses
- **Payment Integration** - Secure payment processing via Paystack
- **Push Notifications** - Order updates and promotional notifications

## 🛠️ Tech Stack

### Core Technologies
- **Monorepo**: Turborepo with pnpm workspace
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm 9.0.0

### Admin Web App
- **Framework**: Next.js 16.3.4 (App Router)
- **UI**: React 19.2.8, Tailwind CSS 4
- **State Management**: React hooks
- **Charts**: Recharts
- **Notifications**: Sonner
- **Validation**: Zod

### Mobile Apps (Attendant & Customer)
- **Framework**: Expo 57.0.20 with Expo Router
- **UI**: React Native 0.86.3, React Native Web
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage, SecureStore
- **Animations**: React Native Reanimated
- **Notifications**: Expo Notifications

### Backend & Services
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **File Storage**: Cloudflare R2 (AWS S3 SDK)
- **Payments**: Paystack
- **Email**: Zoho Mail / OneSignal
- **Push Notifications**: Expo Notifications

### Shared Package
- **Utilities**: Common TypeScript utilities and types
- **Shared Types**: TypeScript interfaces used across all apps

## 📁 Project Structure

```
PharmaGo/
├── apps/
│   ├── admin-app/          # Next.js admin dashboard
│   ├── attendant-app/      # Expo React Native attendant app
│   └── customer-app/       # Expo React Native customer app
├── packages/
│   └── shared/             # Shared utilities and types
├── database/
│   ├── schema.sql          # PostgreSQL database schema
│   └── migrations/         # Database migration files
├── supabase/               # Supabase configuration
├── docs/                   # Documentation
├── logo/                   # Application logos and assets
├── package.json            # Root package.json
├── turbo.json              # Turborepo configuration
├── pnpm-workspace.yaml     # pnpm workspace configuration
└── tsconfig.json           # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm 9.0.0
- Expo CLI (for mobile development)
- Supabase account
- Cloudflare R2 account
- Paystack account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yahadeen/Yahadeen-pharmacy-app.git
   cd PharmaGo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   Copy the example environment file and configure your variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   - Supabase configuration (URL, anon key, service role key)
   - Cloudflare R2 credentials
   - Paystack API keys
   - Email service configuration
   - Expo project credentials

4. **Database Setup**
   - Create a Supabase project
   - Run the database schema from `database/schema.sql`
   - Configure Supabase Auth with your JWT secret

### Development

**Run all applications:**
```bash
pnpm dev
```

**Run specific applications:**
```bash
# Admin dashboard
pnpm dev:admin

# Customer mobile app
pnpm dev:customer

# Attendant mobile app
pnpm dev:attendant
```

**Build all applications:**
```bash
pnpm build
```

**Type checking:**
```bash
pnpm typecheck
```

**Linting:**
```bash
pnpm lint
```

**Formatting:**
```bash
pnpm format
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users & Profiles**: Users synced with Supabase Auth, with role-based profiles (admin, attendant, customer)
- **Products & Categories**: Hierarchical product categorization with inventory tracking
- **Orders & Order Items**: Complete order management with status workflow
- **Addresses**: Customer delivery addresses
- **Inventory Adjustments**: Stock change tracking with audit trail
- **Notifications**: System notifications with priority levels

## 🔐 Security Features

- **Authentication**: Supabase Auth with JWT tokens
- **Role-Based Access Control**: Four user roles (super_admin, admin, attendant, customer)
- **Secure Storage**: Sensitive data stored in Expo SecureStore
- **Environment Variables**: All secrets managed via environment files
- **API Key Protection**: Service role keys secured on backend only

## 📱 Mobile App Deployment

### Using EAS Build

The mobile apps are configured for deployment using Expo Application Services (EAS):

1. **Configure EAS**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Build for different platforms**
   ```bash
   # Build for iOS
   eas build --platform ios

   # Build for Android
   eas build --platform android

   # Build for both
   eas build --platform all
   ```

3. **Submit to app stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## 🌐 Admin App Deployment

The admin app can be deployed to various platforms:

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative hosting option
- **Docker**: Containerized deployment
- **Self-hosted**: Node.js server deployment

## 🧪 Testing

Run tests for specific packages:
```bash
pnpm --filter <package-name> test
```

## 📊 Key Features by Role

### Super Admin
- Full system configuration
- User management and permissions
- Business analytics and reporting
- System settings and integrations

### Admin
- Product and inventory management
- Order processing and fulfillment
- Staff management
- Customer support

### Attendant
- Order acceptance and preparation
- Inventory access and updates
- Shift management
- Customer service

### Customer
- Product browsing and search
- Order placement and tracking
- Prescription management
- Payment processing
- Address management

## 🔧 Configuration Files

- **.gitignore**: Git ignore patterns
- **.easignore**: EAS build ignore patterns
- **turbo.json**: Turborepo pipeline configuration
- **tsconfig.json**: TypeScript configuration
- **.npmrc**: npm/pnpm configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and inquiries:
- Email: support@yahadeen.ng
- Website: https://yahadeen.ng

## 🙏 Acknowledgments

- Built with modern web and mobile technologies
- Powered by Supabase, Cloudflare, and Paystack
- Designed for pharmacy excellence

---

**Version**: 1.0.0  
**Last Updated**: September 2026  
**Repository**: https://github.com/Yahadeen/Yahadeen-pharmacy-app.git