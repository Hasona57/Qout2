# Qote Abaya System - Setup Guide

## Environment Variables Setup

### Backend (.env)
1. Copy `backend/env.example` to `backend/.env`:
   ```bash
   cd backend
   cp env.example .env
   ```

2. Update the following values in `backend/.env`:
   - `JWT_SECRET`: Generate a strong secret key
   - `PAYMOB_API_KEY`: Your Paymob API key
   - `PAYMOB_INTEGRATION_ID`: Your Paymob integration ID
   - `FAWRY_MERCHANT_CODE`: Your Fawry merchant code
   - `FAWRY_SECURITY_KEY`: Your Fawry security key

### Frontend Store (.env.local)
1. Copy `frontend/store/env.example` to `frontend/store/.env.local`:
   ```bash
   cd frontend/store
   cp env.example .env.local
   ```

### Frontend Admin (.env.local)
1. Copy `frontend/admin/env.example` to `frontend/admin/.env.local`:
   ```bash
   cd frontend/admin
   cp env.example .env.local
   ```

### Frontend POS (.env.local)
1. Copy `frontend/pos/env.example` to `frontend/pos/.env.local`:
   ```bash
   cd frontend/pos
   cp env.example .env.local
   ```

## Quick Start

1. **Install dependencies:**
   ```bash
   # Root
   npm install
   
   # Backend
   cd backend
   npm install
   
   # Frontend Store
   cd ../frontend/store
   npm install
   
   # Frontend Admin
   cd ../admin
   npm install
   
   # Frontend POS
   cd ../pos
   npm install
   ```

2. **Start Docker services:**
   ```bash
   # From root directory
   npm run docker:up
   # or
   docker-compose up -d
   ```

3. **Run database migrations:**
   ```bash
   cd backend
   npm run migration:run
   ```

4. **Seed database:**
   ```bash
   cd backend
   npm run seed:run
   ```

5. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Store
   npm run dev:store
   
   # Terminal 3 - Admin
   npm run dev:admin
   
   # Terminal 4 - POS
   npm run dev:pos
   ```

## Access Points

- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Customer Store**: http://localhost:3001
- **Admin Panel**: http://localhost:3002
- **Web POS**: http://localhost:3003
- **MinIO Console**: http://localhost:9001 (qote_admin / qote_password)
- **RabbitMQ Management**: http://localhost:15672 (qote_user / qote_password)

## Default Login

- **Email**: admin@qote.com
- **Password**: admin123

## Important Notes

- Make sure Docker is running before starting services
- PostgreSQL will be available on port 5432
- Redis will be available on port 6379
- All services use the `qote-network` Docker network






