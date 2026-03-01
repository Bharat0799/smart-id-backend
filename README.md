# Smart ID Backend

## Folder Structure

```
backend/
  src/
    app.js
    server.js
    config/
      db.js
      mailer.js
    controllers/
      authController.js
      applicationController.js
      adminController.js
    middleware/
      authMiddleware.js
      roleMiddleware.js
    models/
      Student.js
      Admin.js
      Application.js
    routes/
      authRoutes.js
      applicationRoutes.js
      adminRoutes.js
    seed/
      seedUsers.js
    utils/
      generateToken.js
      sendApplicationEmail.js
  .env.example
  package.json
```

## Setup

1. Install dependencies
```bash
cd backend
npm install
```

2. Create env file
```bash
copy .env.example .env
```

3. Update `.env` values for MongoDB and SMTP.

4. Seed fixed students and admin
```bash
npm run seed
```

5. Start server
```bash
npm run dev
```

## MongoDB Connection

Set `MONGODB_URI` in `.env`.
Example:

```
MONGODB_URI=mongodb://127.0.0.1:27017/smart-id
```

## Auth Accounts

### Students (login by `idNumber` + `dob` as password)
- `cse001 / 07082006`
- `cse002 / 15092006`
- `ece001 / 02032006`
- `mech001 / 11012006`
- `ece002 / 25072006`

### Admin
- `admin@smartid.com / admin123`

## API Routes

- `POST /api/auth/login`
- `POST /api/applications/apply`
- `GET /api/applications/my`
- `GET /api/admin/applications`
- `PUT /api/admin/application/:id/status`

## API Testing Examples

### 1) Student Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idNumber":"cse001","password":"07082006"}'
```

### 2) Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartid.com","password":"admin123"}'
```

### 3) Student Apply
```bash
curl -X POST http://localhost:5000/api/applications/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -d '{"name":"sai","idNumber":"cse001","department":"cse","email":"student@example.com","reason":"Lost ID card"}'
```

### 4) Student View My Applications
```bash
curl http://localhost:5000/api/applications/my \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

### 5) Admin Get All Applications
```bash
curl http://localhost:5000/api/admin/applications \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6) Admin Update Status
```bash
curl -X PUT http://localhost:5000/api/admin/application/APPLICATION_MONGO_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"status":"Rejected","remarks":"Photo proof not clear"}'
```

## Email Notification Rules

- Application submission sends email to `application.email`.
- Status change to `Approved`, `Rejected`, `Printing`, `Ready`, `Completed` sends email to the same `application.email`.
- `Rejected` email includes remarks.
- Student model email is not used for notifications.
