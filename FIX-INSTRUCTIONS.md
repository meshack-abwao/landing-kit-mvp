# COMPLETE FIX FOR LANDING KIT MVP - CACHE & PORT ISSUES

## THE PROBLEM
- Multiple Vite instances on different ports (5173, 5174, 5177)
- Browser aggressively caching old JavaScript
- Vite caching old builds
- Changes not reflecting even after restart

## THE SOLUTION (Follow in Order!)

### STEP 1: Download Scripts
Save these 4 files to: C:\Users\ADMIN\Desktop\landing-kit-mvp\

1. kill-all-servers.bat
2. restart-all-clean.bat  
3. verify-fix.bat
4. check-ports.bat

### STEP 2: Run Diagnostic
```
Double-click: check-ports.bat
```
This shows what's running on each port.

### STEP 3: Verify Fix is in File
```
Double-click: verify-fix.bat
```
This checks if DashboardLayout.jsx has the fix.

### STEP 4: Clean Restart
```
Double-click: restart-all-clean.bat
```
This will:
- Kill all Node processes
- Clear Vite cache
- Clear npm cache
- Start Backend (3000)
- Start Dashboard (5173)
- Start Store (5177)

### STEP 5: Clear Browser Cache (CRITICAL!)

**Option A: Incognito Mode (Easiest)**
```
Chrome: Ctrl + Shift + N
Edge: Ctrl + Shift + P
```
Then navigate to: http://localhost:5173

**Option B: Hard Refresh**
```
1. Open: http://localhost:5173
2. Press: Ctrl + Shift + R (or Ctrl + F5)
3. Press: F12 (open DevTools)
4. Right-click refresh button → "Empty Cache and Hard Reload"
```

**Option C: Nuclear Option (Most Thorough)**
```
1. Press: Ctrl + Shift + Delete
2. Select: "All time"
3. Check: Cached images and files, Cookies and site data
4. Click: Clear data
5. Close ALL browser windows
6. Restart browser
```

### STEP 6: Verify Fix Works

Open Dashboard: http://localhost:5173

Test:
1. ✅ Page loads without dark overlay
2. ✅ Click "Account & Billing" - modal opens
3. ✅ Press ESC key - modal closes
4. ✅ Click outside modal - closes properly
5. ✅ Settings changes save and reload

---

## PORT REFERENCE
- 3000: Backend API
- 5173: Dashboard (admin panel)
- 5177: Store (customer-facing)

## IF STILL NOT WORKING

1. Check browser console (F12) for errors
2. Make sure you closed ALL browser tabs of localhost
3. Try different browser entirely
4. Run verify-fix.bat to confirm file has changes

---

## COMMON MISTAKES
❌ Not closing all browser tabs
❌ Not clearing browser cache
❌ Opening regular tab instead of incognito
❌ Not waiting for servers to fully start
❌ Still have old servers running on wrong ports

✅ Use incognito mode
✅ Clear all caches
✅ Wait 5 seconds between server starts
✅ Verify with check-ports.bat first
