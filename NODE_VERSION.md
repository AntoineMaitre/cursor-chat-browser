# Node.js Version Requirements

## Recommended Node.js Version

**Use Node.js 18.18.0 or later (LTS versions recommended)**

### Supported Versions:
- ✅ **Node.js 18 LTS** (18.18.0+) - Minimum supported
- ✅ **Node.js 20 LTS** (20.x) - Recommended
- ✅ **Node.js 22 LTS** (22.x) - Latest stable

## Why These Versions?

The project uses modern dependencies that require recent Node.js features:

- **Next.js 15.5.6** requires Node.js 18.18.0 or later
- **React 19.2.0** works best with Node.js 18+
- **Better-sqlite3 12.4.1** requires Node.js native modules (needs rebuild for your Node version)
- **TypeScript 5.9.3** and modern ES modules

## Current Project Dependencies

- **Next.js**: 15.5.6
- **React**: 19.2.0
- **React-dom**: 19.2.0
- **TypeScript**: 5.9.3
- **Tailwind CSS**: 3.4.18
- **Better-sqlite3**: 12.4.1
- **Puppeteer**: 24.29.1

## Installation Instructions

### 1. Check Your Node.js Version

```bash
node --version
```

### 2. If You Need to Update Node.js

**Using nvm (recommended):**
```bash
# Install Node.js 20 LTS
nvm install 20
nvm use 20

# Or install Node.js 22
nvm install 22
nvm use 22
```

**Using official installers:**
- Download from [nodejs.org](https://nodejs.org/)
- Choose the LTS version (20.x or 22.x)

### 3. Install Dependencies

```bash
# Install dependencies and rebuild native modules
npm install

# If better-sqlite3 has issues, rebuild it
npm rebuild better-sqlite3
```

### 4. Skip Puppeteer Chrome Download (Optional)

If you encounter network issues with Puppeteer downloading Chrome:

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

## Troubleshooting

### Error: `MODULE_VERSION` mismatch

This means `better-sqlite3` was compiled for a different Node.js version.

**Solution:**
```bash
npm rebuild better-sqlite3
```

### Error: Cannot find module

Clean install:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Puppeteer fails to download Chrome

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
# Puppeteer is only used for PDF generation and is optional
```

## Version Manager Recommendations

### For macOS/Linux:
- **[nvm](https://github.com/nvm-sh/nvm)** (Node Version Manager)
- **[fnm](https://github.com/Schniz/fnm)** (Fast Node Manager - Rust-based, faster)

### For Windows:
- **[nvm-windows](https://github.com/coreybutler/nvm-windows)**
- **[fnm](https://github.com/Schniz/fnm)** (cross-platform)

## CI/CD Configuration

### GitHub Actions Example:

```yaml
name: Build and Test
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run build
      - run: npm test
```

### Docker Example:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Development vs Production

### Development:
```bash
npm run dev
```

### Production Build:
```bash
npm run build
npm start
```

## Notes

- The project uses ES modules and modern JavaScript features
- Native modules like `better-sqlite3` need to be rebuilt if you switch Node.js versions
- React 19 and Next.js 15 are cutting-edge versions (released late 2024/early 2025)
- All security vulnerabilities have been addressed (0 vulnerabilities as of this update)

## Last Updated

- **Date**: January 2025
- **Node.js version used for testing**: 22.21.0
- **npm version**: 10.9.2

---

For any issues, please check:
1. Your Node.js version is 18.18.0 or later
2. Run `npm rebuild better-sqlite3` after installing or switching Node versions
3. Clear `node_modules` and reinstall if you encounter persistent issues
