# Shrink .git by removing CBZ from history

Adding `*.cbz` to .gitignore only affects **new** commits. Your `.git` is still ~7 GB because **every past commit** still has the CBZ files. To actually shrink it, you must rewrite history and remove those files from all commits.

## Option 1: git filter-repo (recommended)

### 1. Install git filter-repo

**Windows (Python):**
```powershell
pip install git-filter-repo
```
If that fails, install Python 3 from python.org and try again.

**Or** download the single file from: https://github.com/newren/git-filter-repo/releases and put it somewhere in your PATH.

### 2. Backup your repo (optional but safe)

```powershell
cd C:\Users\MY PC\Desktop
Copy-Item -Recurse LN-Reader LN-Reader-backup
```

### 3. Remove all .cbz from Git history

```powershell
cd "C:\Users\MY PC\Desktop\LN-Reader"
git filter-repo --path-glob "*.cbz" --invert-paths --force
```

`--force` is needed because filter-repo refuses to run on repos with remotes by default.

### 4. Re-add your remote (it gets removed by filter-repo)

```powershell
git remote add origin <your-remote-url>
```
(Use the same URL you had before, e.g. from `git remote -v` in your backup.)

### 5. Force-push (if you use GitHub/GitLab etc.)

```powershell
git push --force origin main
```
(Use your branch name if it's not `main`.)

**Warning:** This rewrites history. Anyone who has cloned the repo will need to re-clone or reset to the new history.

---

## Option 2: BFG Repo-Cleaner

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Backup, then run something like:
   ```powershell
   java -jar bfg.jar --delete-files "*.cbz" "C:\Users\MY PC\Desktop\LN-Reader"
   cd "C:\Users\MY PC\Desktop\LN-Reader"
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```
3. Force-push if you have a remote.

---

After this, `.git` should be much smaller. Your **working copy** still has the CBZ files on disk (they’re just ignored by Git). Keep them there for building the app.
