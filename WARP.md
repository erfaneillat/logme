# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with three primary apps:
  - Mobile app (Flutter/Dart) under lib/, android/, ios/
  - Backend API (Node.js + TypeScript + Express + MongoDB) under server/
  - Web app (React + TypeScript, Create React App) under website/
- Additional project automation and rules:
  - GitHub Actions deployment workflow in .github/workflows/deploy.yml
  - Cursor rules in .cursor/rules/

Architecture and code structure (big picture)
- Mobile (Flutter)
  - Clean Architecture by feature modules in lib/features/* with layers:
    - Domain: entities, repository interfaces, usecases
    - Data: datasources, repository implementations, providers
    - Presentation: state providers (Riverpod), pages/widgets
  - Cross-cutting:
    - Networking via services/api_service.dart (Dio client with interceptors, token management, logging)
    - Routing via router/app_router.dart (go_router), NavigationService helpers
    - Config via lib/config/* (ApiConfig, environment.dart, theme)
    - Common widgets and utils under lib/common and lib/utils
  - Notable flows implemented: login (OTP-based auth), additional_info (post-login profile setup), food_recognition (image/text analysis), plan, logs, analytics, settings, streak, onboarding, home

- Backend API (server)
  - Node 18+, TypeScript, Express
  - Follows layered organization described in server/README.md:
    - Domain layer: core types/abstractions
    - Data layer: repository implementations and data sources
    - Presentation: controllers, routes, middleware
    - Infrastructure: DB connection (MongoDB), external services (OpenAI, Kavenegar)
  - TypeScript path aliases configured in server/tsconfig.json (e.g., @/controllers/*, @/services/*)
  - Provides endpoints for authentication (OTP), user profile/additional info, plans, food analysis, logs, and health checks

- Web app (website)
  - Create React App (TypeScript)
  - i18n via i18next and react-i18next; Tailwind included
  - Consumes the backend API; build-time API base URL provided via REACT_APP_API_URL

- CI/CD
  - .github/workflows/deploy.yml builds server and website on pushes to master/main/dev and on manual dispatch
  - Environment is inferred by branch (dev → development; others → production)
  - Builds server (tsc) and CRA website; deploys to a remote host and manages server with PM2

- Cursor rules
  - .cursor/rules/architecture.mdc: alwaysApply: true (no additional content)
  - .cursor/rules/translation.mdc: guidance to add new words to en and fa translation (alwaysApply: false)

Commands and workflows
- Prerequisites
  - Node.js 18+ for server/ and website/
  - Flutter SDK for the mobile app (and Xcode/CocoaPods for iOS builds)
  - MongoDB for backend development

- First-time setup
  - Backend API (server/)
    ```bash
    cd server
    cp .env.example .env
    # edit .env to set at least: MONGODB_URI, JWT_SECRET, CORS_ORIGIN, OPENAI_API_KEY, KAVENEGAR_API_KEY
    npm install
    ```
  - Web app (website/)
    ```bash
    cd website
    npm install
    ```
  - Mobile app (Flutter)
    ```bash
    flutter pub get
    ```

- Run in development
  - Backend API (hot reload with nodemon)
    ```bash
    cd server
    npm run dev
    ```
  - Web app
    - The backend default CORS_ORIGIN in server/.env.example is http://localhost:3001. Start CRA on port 3001 to match:
    ```bash
    cd website
    PORT=3001 npm start
    ```
  - Mobile app (use dev environment base URL from ApiConfig)
    ```bash
    # iOS Simulator or Android emulator must be running
    flutter run --dart-define=ENVIRONMENT=dev
    ```

- Build
  - Backend API
    ```bash
    cd server
    npm run build     # outputs to dist/
    npm start         # runs dist/index.js
    ```
  - Web app (build with API URL)
    ```bash
    cd website
    REACT_APP_API_URL=http://localhost:3000/api npm run build
    ```
  - Mobile app
    ```bash
    # Android
    flutter build apk --dart-define=ENVIRONMENT=prod
    # iOS
    flutter build ios --dart-define=ENVIRONMENT=prod
    ```

- Linting and formatting
  - Backend API
    ```bash
    cd server
    npm run lint      # eslint on src/**/*.ts
    ```
  - Mobile app
    ```bash
    flutter analyze
    dart format .
    ```

- Tests
  - Backend API (Jest)
    ```bash
    cd server
    npm test
    # run a single test file
    npm test -- path/to/test.spec.ts
    # or by name pattern
    npm test -- -t "pattern"
    ```
  - Web app (react-scripts)
    ```bash
    cd website
    npm test
    # run a single test by filename pattern
    npm test -- src/path/to/MyComponent.test.tsx
    # or by name pattern
    npm test -- -t "renders component"
    ```
  - Mobile app (Flutter)
    ```bash
    # all tests
    flutter test
    # a single test file
    flutter test test/phone_auth_test.dart
    flutter test test/widget/phone_auth_widget_test.dart
    ```

Environment and configuration
- Backend API (server/.env)
  - Key variables (see server/.env.example and server/README.md):
    - PORT (default 3000), HOST
    - MONGODB_URI, MONGODB_TEST_URI
    - JWT_SECRET, JWT_EXPIRES_IN
    - CORS_ORIGIN (e.g., http://localhost:3001 for local CRA dev)
    - OPENAI_API_KEY (food analysis) and KAVENEGAR_API_KEY/KAVENEGAR_OTP_TEMPLATE (OTP)
- Mobile app
  - ApiConfig in lib/config/api_config.dart defines base URLs per environment
  - Select environment via --dart-define=ENVIRONMENT=dev|prod
- Web app
  - Provide API base at build/run time via REACT_APP_API_URL

Integration notes (mobile/web ↔ server)
- Local development topology
  - Server on http://localhost:3000
  - Website on http://localhost:3001 (to match server CORS_ORIGIN default)
  - Mobile app dev base URL pointing to http://localhost:3000 (ENVIRONMENT=dev)
- Image upload and analysis: server exposes POST /api/food/analyze (multipart/form-data with image)
- Auth: OTP flow via /api/auth/send-code and /api/auth/verify-phone; client persists tokens via secure storage (mobile)

CI/CD quick reference
- Workflow: .github/workflows/deploy.yml
  - Triggers: push to master/main/dev, or manual dispatch
  - Builds server (tsc) and website (CRA) with REACT_APP_API_URL per environment
  - Deploys to remote host, manages Node process with PM2, health checks /api/health

Where to find more details
- server/README.md: features, environment variables, endpoints, architecture, security
- lib/services/README.md: ApiService usage and configuration
- lib/features/*/README.md: feature-specific flows (login, additional_info)
- lib/router/README.md: go_router usage and NavigationService
- .cursor/rules/: project rules for Cursor (architecture rule enabled by default; translation rule for en/fa additions)
