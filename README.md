# Peer-to-Peer Chat Messaging App

### Developed by **Chidiebere Emmanuel Uzoma**

---

## Setup and Run Instructions

### **Backend Setup (Feathers.js + Node.js)**

#### 1. Clone the Repository and Install Dependencies

```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Configure Environment Variables

Create a .env file inside the backend directory with the following content:
PORT=4000
CLIENT_URL=http://localhost:3000

### 3. Start the Backend Server

```bash
npm run dev
```

### Backend Server starts on http://localhost:4000

### Frontend Setup (Nuxt 2 + Vue 2)

### 1. Navigate to the Frontend Directory, Install Dependencies, and Run the Application

```bash
cd frontend
npm install
npm run dev
```

Login and Usage

Register a new user with first name, last name, email, and password.

Log in using the registered credentials.

Start a conversation by searching and selecting a user from the sidebar.

Messages sent to online users are delivered instantly.

Messages sent to offline users are temporarily stored and delivered automatically when they come online.

### Backend Dependencies

| Package                  | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| **@feathersjs/feathers** | Core Feathers framework for services and hooks.      |
| **@feathersjs/express**  | Integrates Feathers with Express.js.                 |
| **@feathersjs/socketio** | Enables real-time communication using Socket.IO.     |
| **mongodb**              | MongoDB driver for database operations.              |
| **cors**                 | Middleware for enabling cross-origin requests.       |
| **bcryptjs**             | Used for password hashing.                           |
| **jsonwebtoken**         | Implements JWT authentication.                       |
| **uuid**                 | Generates unique identifiers for messages and users. |

### Backend Dependencies

| Package                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| **nuxt@2**             | Framework for building Vue.js applications.                |
| **vue@2**              | JavaScript framework for reactive UI development.          |
| **@feathersjs/client** | Feathers client for connecting via REST or Socket.IO.      |
| **socket.io-client**   | Enables real-time communication between client and server. |
| **axios**              | HTTP client for RESTful API calls.                         |
| **tailwindcss**        | Utility-first CSS framework for styling.                   |
| **typescript**         | Adds static type checking to the frontend.                 |

### Development Tools

| Tool        | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| **nodemon** | Automatically restarts the server during development.       |
| **ts-node** | Runs TypeScript directly in Node.js without precompilation. |
| **webpack** | Bundles the frontend source code for deployment.            |
