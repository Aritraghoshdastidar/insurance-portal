# What to Include in the ZIP File

## ✅ INCLUDE These:
- [ ] All source code files (*.js, *.jsx, *.css, *.html)
- [ ] package.json (root)
- [ ] package-lock.json (root)
- [ ] insurance-frontend/package.json
- [ ] insurance-frontend/package-lock.json
- [ ] database_scripts/ folder (with .sql files)
- [ ] __tests__/ folder
- [ ] insurance-frontend/src/ folder
- [ ] insurance-frontend/public/ folder
- [ ] README.md
- [ ] SETUP_INSTRUCTIONS.md
- [ ] jest.config.js
- [ ] .gitignore

## ❌ EXCLUDE These (Large/Generated Files):
- [ ] node_modules/ (root) - **EXCLUDE** (~200MB+)
- [ ] insurance-frontend/node_modules/ - **EXCLUDE** (~300MB+)
- [ ] coverage/ - **EXCLUDE** (test coverage reports)
- [ ] insurance-frontend/build/ - **EXCLUDE** (if exists)
- [ ] .env - **EXCLUDE** (contains passwords - they'll create their own)
- [ ] uploads/* - **EXCLUDE** (user uploaded files)
- [ ] *.log - **EXCLUDE** (log files)
- [ ] .DS_Store - **EXCLUDE** (Mac files)
- [ ] Thumbs.db - **EXCLUDE** (Windows files)

## ⚠️ IMPORTANT: Create .env Template
Instead of including .env, create a .env.example file with this content:

```
JWT_SECRET=your_super_secret_key_12345
DB_USER=insurance_app
DB_PASSWORD=app_password_123
```

## Issues Your Friend Will Face:

### 1. **node_modules Not Included** ❌
- **Problem**: Dependencies are not in the ZIP (too large)
- **Solution**: They need to run `npm install` in both root and frontend folders

### 2. **.env File Not Included** ❌
- **Problem**: No database credentials
- **Solution**: They need to create `.env` file (see SETUP_INSTRUCTIONS.md)

### 3. **MySQL Database Empty** ❌
- **Problem**: Database doesn't exist on their machine
- **Solution**: They need to:
  - Install MySQL
  - Create database user
  - Import the backup SQL file

### 4. **Absolute Paths** ⚠️
- **Problem**: MySQL path might be different on their machine
- **Solution**: They may need to adjust MySQL path in commands

## PowerShell Commands to Create Clean ZIP:

### Option 1: Using File Explorer (Easiest)
1. Open the project folder
2. Delete `node_modules` folders (both root and frontend)
3. Delete `.env` file
4. Delete `coverage` folder
5. Select all remaining files
6. Right-click → Send to → Compressed (zipped) folder

### Option 2: Using PowerShell (Advanced)
```powershell
# Navigate to project directory
cd C:\Users\aritr\insurance-archita

# Create exclusion list
$exclude = @('node_modules', 'coverage', '.env', 'uploads', '*.log')

# Compress (you'll need 7-Zip or use Compress-Archive)
Compress-Archive -Path * -DestinationPath ..\insurance-archita-v1.zip -Force -CompressionLevel Optimal
```

## Recommended: Use Git Instead

Instead of ZIP, consider:
1. Push to GitHub/GitLab (private repository)
2. Your friend clones the repo
3. They follow SETUP_INSTRUCTIONS.md
4. .gitignore already excludes node_modules and .env

## Estimated Sizes:
- **With node_modules**: ~500MB-800MB
- **Without node_modules**: ~5-20MB
- **Just source code**: ~2-5MB

## Quick Checklist Before Zipping:
```powershell
# Verify these commands work in a clean folder
npm install          # Backend
cd insurance-frontend
npm install          # Frontend
cd ..
node server.js       # Should start server
# In another terminal:
cd insurance-frontend
npm start            # Should start frontend
```
