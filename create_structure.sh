#!/bin/bash

# =========================
# Frontend directories
# =========================

mkdir -p frontend/src/assets
mkdir -p frontend/src/components
mkdir -p frontend/src/pages/boarder
mkdir -p frontend/src/pages/admin
mkdir -p frontend/src/services
mkdir -p frontend/src/context
mkdir -p frontend/src/routes

# Frontend files
touch frontend/package.json
touch frontend/vite.config.js
touch frontend/index.html
touch frontend/src/main.jsx
touch frontend/src/App.jsx

touch frontend/src/components/Navbar.jsx
touch frontend/src/components/Sidebar.jsx
touch frontend/src/components/RoomCard.jsx
touch frontend/src/components/PaymentCard.jsx
touch frontend/src/components/NoticeCard.jsx

touch frontend/src/pages/Login.jsx
touch frontend/src/pages/Register.jsx

touch frontend/src/pages/boarder/BoarderDashboard.jsx
touch frontend/src/pages/boarder/MyRoom.jsx
touch frontend/src/pages/boarder/RoomDirectory.jsx
touch frontend/src/pages/boarder/Payments.jsx
touch frontend/src/pages/boarder/MessBills.jsx
touch frontend/src/pages/boarder/RoomSwap.jsx
touch frontend/src/pages/boarder/Notices.jsx
touch frontend/src/pages/boarder/Events.jsx

touch frontend/src/pages/admin/AdminDashboard.jsx
touch frontend/src/pages/admin/Students.jsx
touch frontend/src/pages/admin/Rooms.jsx
touch frontend/src/pages/admin/RoomAllocation.jsx
touch frontend/src/pages/admin/RoomSwaps.jsx
touch frontend/src/pages/admin/Payments.jsx
touch frontend/src/pages/admin/Notices.jsx
touch frontend/src/pages/admin/Events.jsx

touch frontend/src/services/api.js
touch frontend/src/services/authService.js
touch frontend/src/services/roomService.js
touch frontend/src/services/paymentService.js
touch frontend/src/services/roomSwapService.js
touch frontend/src/services/noticeService.js
touch frontend/src/services/eventService.js

touch frontend/src/context/AuthContext.jsx
touch frontend/src/routes/AppRoutes.jsx


# =========================
# Backend directories
# =========================

mkdir -p backend/routes
mkdir -p backend/models
mkdir -p backend/services
mkdir -p backend/utils

# Backend files
touch backend/app.py
touch backend/config.py
touch backend/requirements.txt
touch backend/.env

touch backend/routes/auth_routes.py
touch backend/routes/user_routes.py
touch backend/routes/room_routes.py
touch backend/routes/payment_routes.py
touch backend/routes/room_swap_routes.py
touch backend/routes/notice_routes.py
touch backend/routes/event_routes.py

touch backend/models/user_model.py
touch backend/models/room_model.py
touch backend/models/payment_model.py
touch backend/models/room_swap_model.py
touch backend/models/notice_model.py
touch backend/models/event_model.py

touch backend/services/auth_service.py
touch backend/services/room_service.py
touch backend/services/payment_service.py
touch backend/services/room_swap_service.py
touch backend/services/notice_service.py
touch backend/services/event_service.py

touch backend/utils/auth.py
touch backend/utils/validators.py


# =========================
# Database
# =========================

mkdir -p database

touch database/schema.sql
touch database/seed.sql
touch database/queries.sql


echo ""
echo "================================"
echo "HostelSync structure created!"
echo "================================"