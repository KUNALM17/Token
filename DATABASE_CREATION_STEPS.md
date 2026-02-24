# 📝 HOW TO CREATE DATABASE - STEP BY STEP

## ⏱️ Total Time: 5-10 Minutes

---

## Step 1: Open Supabase SQL Editor

**Go to:** https://oilwihrsslsscojtpghe.supabase.co

You should see your project dashboard.

**Click:** "SQL Editor" in the left sidebar
(Look for the SQL icon under "Development")

**Click:** "New Query" button

---

## Step 2: Copy and Run Schema SQL

### Option A: Copy from File
1. Open file: `/Users/kunalmani/Token1/Token/SETUP_DATABASE.sql`
2. Select ALL the SQL code (Cmd+A)
3. Copy it (Cmd+C)

### Option B: View the SQL Below
All the SQL code is in this file. Copy everything from the `CREATE TABLE` section onwards.

### Then:
1. In Supabase SQL Editor, paste the SQL (Cmd+V)
2. Click **"RUN"** button (green button at top right)
3. Wait for success message

**Expected Output:**
```
Successfully executed 1 migration in X.XXXs
```

---

## Step 3: Verify Tables Created

After running the SQL:

1. Click **"Table Editor"** in left sidebar
2. You should see these 6 tables:
   - `User`
   - `Hospital`
   - `Doctor`
   - `Appointment`
   - `Payment`
   - `OTP`

If you see all 6 tables, **✅ Schema is ready!**

---

## Step 4: Create Another New Query

Click **"New Query"** button again for demo data

---

## Step 5: Copy and Run Demo Data SQL

### Option A: Copy from File
1. Open file: `/Users/kunalmani/Token1/Token/INSERT_DEMO_DATA.sql`
2. Select ALL the SQL code (Cmd+A)
3. Copy it (Cmd+C)

### Option B: See SQL Below
The INSERT statements are in that file.

### Then:
1. Paste the SQL into Supabase SQL Editor (Cmd+V)
2. Click **"RUN"** button
3. Wait for success message

**Expected Output:**
```
Successfully executed X inserts in X.XXXs
```

---

## Step 6: Verify Demo Data Created

After running INSERT_DEMO_DATA.sql:

1. Click **"Table Editor"**
2. Click on **"User"** table
3. You should see these rows:
   - 9000000001 (Super Admin)
   - 9000000002 (Hospital Admin)
   - 9000000003 (Doctor 1)
   - 9000000004 (Doctor 2)
   - 9000000005 (Doctor 3)
   - 9000000100 (Patient 1)
   - 9000000101 (Patient 2)
   - ... and more

If you see the test accounts, **✅ Demo data is ready!**

---

## 🚀 Start Local Servers

Once database is ready, open 2 terminal windows:

### Terminal 1: Backend
```bash
cd /Users/kunalmani/Token1/Token/backend
npm run dev
```

Wait for output:
```
✓ Server running on http://localhost:5000
```

### Terminal 2: Frontend
```bash
cd /Users/kunalmani/Token1/Token/frontend
npm run dev
```

Wait for output:
```
VITE v5.0.8 ready in XXX ms
➜ Local: http://localhost:5173/
```

---

## 🧪 Test the Application

1. **Open Browser:** http://localhost:5173

2. **You should see:** Login page

3. **Enter Phone:** 9000000100 (Patient account)

4. **Click:** "Send OTP"

5. **Check Backend Terminal:** Look for line like:
   ```
   📧 OTP sent to 9000000100: 123456
   ```
   Copy the 6-digit code

6. **Paste OTP:** In the browser, enter the OTP code

7. **Login:** Click "Verify"

8. **Success!** You should see the Patient Dashboard

---

## ✅ Checklist

- [ ] Opened Supabase Dashboard
- [ ] Created New Query
- [ ] Pasted SETUP_DATABASE.sql
- [ ] Clicked RUN
- [ ] Verified 6 tables created
- [ ] Created another New Query
- [ ] Pasted INSERT_DEMO_DATA.sql
- [ ] Clicked RUN
- [ ] Verified demo data in User table
- [ ] Started backend server (npm run dev)
- [ ] Started frontend server (npm run dev)
- [ ] Opened http://localhost:5173
- [ ] Logged in with phone 9000000100
- [ ] Received OTP
- [ ] Successfully logged in ✓

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| SQL failed to execute | Check for syntax errors, try copy-paste again |
| Tables not appearing | Refresh the page, check Table Editor |
| No OTP in backend console | Check backend terminal is still running |
| Can't login | Verify demo data was inserted correctly |
| CORS error | Make sure backend is running on port 5000 |

---

## 📌 Remember

- **After Schema:** Refresh the page to see new tables
- **Test Accounts:** Use phones 9000000100-9000000104 (Patients) or 9000000001-9000000003 (Admins)
- **OTP Auth:** Always check backend console for OTP code
- **Two Terminals:** Must have both backend and frontend running
- **Ports:** Backend=5000, Frontend=5173 (don't use other ports)

---

## ✨ You're All Set!

Database is created, servers are running, and you're ready to test the full application!

