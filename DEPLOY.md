# Deploying to GitHub Pages

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Name it (e.g., `cfs-proxmark3` or `proxmark3-cfs`)
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push Your Code to GitHub

Run these commands in your terminal (replace `YOUR_USERNAME` and `REPO_NAME` with your actual values):

```bash
cd /Users/talaxin/Documents/Github/cfs

# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (GitHub's default)
git branch -M main

# Push your code
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait a few minutes for GitHub to build your site
7. Your site will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

## Step 4: Access Your Live Site

Once GitHub Pages is enabled, you can access your app at:
- `https://YOUR_USERNAME.github.io/REPO_NAME/`

The site will automatically update whenever you push changes to the `main` branch.

## Updating Your Site

To update your site after making changes:

```bash
cd /Users/talaxin/Documents/Github/cfs

# Make your changes to files...

# Stage changes
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push
```

GitHub Pages will automatically rebuild your site (usually takes 1-2 minutes).

## Notes

- GitHub Pages serves static files only (HTML, CSS, JavaScript)
- Web Serial API requires HTTPS, which GitHub Pages provides
- The site will work in Chrome, Edge, and Opera browsers
- Firefox/Safari users can still generate commands to copy/paste

