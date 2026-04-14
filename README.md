<<<<<<< HEAD

# MINOR_PROJECT2

Full-stack Farmer Marketplace web app with authentication, admin dashboard, and product management. Built using MERN stack with modern UI.

# 🌾 Farmer Marketplace (Full Stack Web App)

# A full-stack web application that allows farmers to list and sell their products directly to customers, eliminating middlemen and ensuring better pricing.

# 🌿 FarmFresh – Online Vegetable Marketplace

FarmFresh is a full-stack MERN web application that connects **farmers** directly with **customers** to buy and sell fresh vegetables without middlemen.

> > > > > > > 3f878a8 (initial commit)

---

## 🚀 Features

<<<<<<< HEAD

### 👤 User Features

- User Authentication (Login / Register)
- Browse Products
- Add to Cart & Checkout
- User Profile Management

### 🛠️ Admin Features

- Admin Dashboard
- Manage Products (Add / Edit / Delete)
- Manage Users
- View Orders

---

## 🏗️ Tech Stack

### Frontend

- React.js
- Tailwind CSS
- Vite

### Backend

- Node.js
- Express.js

### Database

- MongoDB

### Other Tools

- JWT Authentication
- # REST APIs

### Farmers

- Register and login as a Farmer
- Add, edit, and delete vegetables
- View all received orders
- Accept and mark orders as Delivered
- Dashboard with stats (products, orders, earnings)

### Customers

- Register and login as a Customer
- Browse all vegetables with search, price filter, and location filter
- View vegetable details
- Add to cart & manage cart
- Place orders
- View order history

---

## 🛠️ Tech Stack

| Layer    | Technology                                               |
| -------- | -------------------------------------------------------- |
| Frontend | React.js (Vite), Tailwind CSS v3, React Router v6, Axios |
| Backend  | Node.js, Express.js                                      |
| Database | MongoDB with Mongoose                                    |
| Auth     | JWT + bcrypt                                             |

> > > > > > > 3f878a8 (initial commit)

---

## 📁 Project Structure

```
<<<<<<< HEAD
/frontend   → React frontend
/server     → Backend API (Node + Express)
=======
MINOR/
├── frontend/              # React app (Vite)
│   └── src/
│       ├── components/    # Navbar, Sidebar, VegetableCard, CartItem
│       ├── context/       # AuthContext.jsx
│       ├── pages/         # All page components
│       ├── services/      # api.js (Axios)
│       ├── App.jsx
│       └── main.jsx
├── server/                # Express backend
│   ├── controllers/       # authController, productController, orderController
│   ├── middleware/        # authMiddleware.js
│   ├── models/            # User, Product, Order
│   ├── routes/            # authRoutes, productRoutes, orderRoutes
│   └── server.js
>>>>>>> 3f878a8 (initial commit)
```

---

## ⚙️ Installation & Setup

<<<<<<< HEAD

### 1. Clone Repository

```
git clone https://github.com/your-username/repo-name.git
cd repo-name
```

### 2. Setup Backend

```
cd server
npm install
npm run dev
```

### 3. Setup Frontend

```
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in server folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

## 📸 Screenshots

(Add screenshots here later)

---

## 🌟 Future Improvements

- Payment Integration
- Order Tracking
- Real-time notifications
- Mobile responsiveness improvements

---

## 🤝 Contributing

Feel free to fork this repo and contribute.

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Author

# Developed by Rajat

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd MINOR
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside `/server`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/farmfresh?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

> ⚠️ **Replace `<username>` and `<password>`** with your MongoDB Atlas credentials.

Start the backend:

```bash
npm run dev
```

The backend will run at `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

The `.env` file is already created at `/frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend will run at `http://localhost:5173`

---

## 🔗 API Endpoints

### Auth

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| POST   | /api/auth/register | Register user    |
| POST   | /api/auth/login    | Login user       |
| GET    | /api/auth/me       | Get current user |

### Products

| Method | Endpoint                | Description             |
| ------ | ----------------------- | ----------------------- |
| GET    | /api/products           | Get all (search/filter) |
| GET    | /api/products/:id       | Get single product      |
| GET    | /api/products/farmer/my | Farmer's products       |
| POST   | /api/products           | Create product (Farmer) |
| PUT    | /api/products/:id       | Update product (Farmer) |
| DELETE | /api/products/:id       | Delete product (Farmer) |

### Orders

| Method | Endpoint               | Description            |
| ------ | ---------------------- | ---------------------- |
| POST   | /api/orders            | Place order (Customer) |
| GET    | /api/orders            | Get orders (by role)   |
| PUT    | /api/orders/:id/status | Update status (Farmer) |

---

## 🌐 Deployment

### Frontend → Vercel or Netlify

1. Push frontend to GitHub
2. Import repo on [Vercel](https://vercel.com)
3. Set environment variable: `VITE_API_URL=https://your-backend-url.com/api`

### Backend → Render

1. Push server to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`

### Database → MongoDB Atlas

1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Whitelist all IPs (0.0.0.0/0)
3. Copy connection string to backend `.env`

---

## 🎨 Color Theme

| Color     | Value            |
| --------- | ---------------- |
| Primary   | Green (#16a34a)  |
| Secondary | White            |
| Accent    | Orange (#f97316) |

---

## 👨‍💻 Authors

Built with ❤️ for the **FarmFresh Minor Project** — Connecting farmers directly to customers.

> > > > > > > 3f878a8 (initial commit)
