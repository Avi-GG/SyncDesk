# SyncVerse - Real-Time Collaboration Platform

A comprehensive real-time collaboration platform built with React and Node.js, featuring multiple collaborative tools including code editing, document editing, whiteboard drawing, and chat functionality.

## 🚀 Features

### 🔐 Authentication System

- User registration and login
- JWT-based authentication
- Protected routes with authentication guards
- Session persistence with localStorage

### 👨‍💻 Real-Time Code Editor

- **Multi-language Support**: JavaScript, Python, Java, C++, and more
- **Live Code Execution**: Run code directly in the browser using Piston API
- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Live Cursors**: See other users' cursor positions in real-time
- **Syntax Highlighting**: Powered by Monaco Editor (VS Code editor)
- **Language Auto-switching**: Automatic code snippets when changing languages
- **Session Persistence**: Code and language selection saved per room

### 📝 Collaborative Document Editor

- **Rich Text Editing**: Full-featured document editor with formatting options
- **Real-time Collaboration**: Multiple users can edit documents simultaneously
- **Live Cursors & Selections**: See where other users are editing
- **Role-based Access Control**: Owner, Editor, and Viewer roles
- **Document Sharing**: Generate public links with configurable access levels
- **Version Control**: Document history and collaboration tracking
- **Import/Export**: Support for various document formats

### 🎨 Interactive Whiteboard

- **Drawing Tools**: Pen, eraser, shapes (rectangle, circle, line, triangle, star)
- **Color Palette**: Customizable colors for drawing
- **Shape Tools**: Draw geometric shapes with live preview
- **Fill Tool**: Fill closed areas with selected colors
- **Undo/Redo**: Complete drawing history management
- **Real-time Sharing**: See other users drawing in real-time
- **Live Cursors**: Track drawing cursors of other users
- **Session Persistence**: Drawings saved per room session

### 💬 Real-Time Chat

- **Instant Messaging**: Real-time chat within each room
- **Typing Indicators**: See when users are typing
- **User Presence**: Display online users in each room
- **Message History**: Persistent chat history stored in database
- **Room-based**: Separate chat for each collaboration room

### 🏠 Room Management

- **Unique Room Generation**: UUID-based room creation
- **Multi-tool Access**: Each room supports all collaboration tools
- **Room Sharing**: Shareable links for different tools within a room
- **User Tracking**: Track online users per room
- **Session Management**: Maintain tool states per room

## 🛠 Tech Stack

### Frontend

- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing with protected routes
- **Socket.IO Client** - Real-time WebSocket communication
- **Monaco Editor** - VS Code-powered code editor
- **Quill Editor** - Rich text editor for documents
- **Chakra UI** - Component library for consistent UI
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Icons** - Comprehensive icon library
- **Axios** - HTTP client for API requests
- **UUID** - Generate unique room identifiers

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables management

### External APIs

- **Piston API** - Code execution engine supporting multiple languages

## 📁 Project Structure

```
collab/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── CodeEditor.jsx        # Real-time code editor
│   │   │   ├── LanguageSelector.jsx  # Programming language selector
│   │   │   ├── Navbar.jsx           # Navigation component
│   │   │   ├── Output.jsx           # Code execution output
│   │   │   └── ProtectedRoute.jsx   # Authentication guard
│   │   ├── context/          # React context providers
│   │   │   ├── RoomContext.jsx      # Room state management
│   │   │   └── SocketContext.jsx    # Socket.IO connection
│   │   ├── helpers/          # Utility functions
│   │   │   ├── api.js              # API communication helpers
│   │   │   ├── constants.js        # App constants and configs
│   │   │   └── theme.js            # Theme configuration
│   │   ├── pages/            # Main application pages
│   │   │   ├── ChatRoom.jsx        # Chat and whiteboard page
│   │   │   ├── Dashboard.jsx       # User dashboard
│   │   │   ├── DocsEditor.jsx      # Document editor page
│   │   │   ├── Home.jsx            # Landing page (protected)
│   │   │   ├── Login.jsx           # User login page
│   │   │   ├── Register.jsx        # User registration page
│   │   │   └── Whiteboard.jsx      # Whiteboard component
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Application entry point
│   │   └── router.jsx        # Routing configuration
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
├── backend/                  # Node.js backend application
│   ├── models/               # MongoDB data models
│   │   ├── ChatMessage.js          # Chat message schema
│   │   ├── Document.js             # Document schema
│   │   └── User.js                 # User schema
│   ├── routes/               # Express route handlers
│   │   ├── authRoutes.js           # Authentication routes
│   │   └── codeEditorRoutes.js     # Code editor routes
│   ├── utils/                # Backend utilities
│   ├── server.js             # Main server file with Socket.IO
│   └── package.json          # Backend dependencies
└── README.md                 # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd collab
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**

   Create a `.env` file in the backend directory:

   ```env
   MONGO_URI=mongodb://localhost:27017/syncverse
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

5. **Start the Backend Server**

   ```bash
   cd backend
   npm start
   ```

   The backend will run on `http://localhost:5000`

6. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

## 🎯 Usage

### Getting Started

1. **Register/Login**: Create an account or login with existing credentials
2. **Access Home**: After authentication, you'll be redirected to the home page
3. **Generate Room**: Click "Generate Room Link" to create a new collaboration room
4. **Choose Tool**: Select from Code Editor, Docs Editor, or Whiteboard
5. **Share**: Copy and share room links with collaborators
6. **Collaborate**: Work together in real-time with multiple users

### Code Editor Features

- Select programming language from the dropdown
- Write code with syntax highlighting and auto-completion
- Run code and see output in real-time
- Collaborate with others and see their cursors
- Code is automatically saved per room

### Document Editor Features

- Create and edit rich text documents
- Format text with various styling options
- See real-time edits from collaborators
- Manage document permissions and sharing
- Export documents in multiple formats

### Whiteboard Features

- Choose from various drawing tools
- Select colors for drawing and shapes
- Draw shapes with live preview
- Use undo/redo for drawing history
- See real-time drawing from other users

### Chat Features

- Send real-time messages in each room
- See typing indicators when others are typing
- View list of online users in the room
- Chat history is preserved across sessions

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Code Editor

- Code execution handled via Piston API integration

### Real-time Features

Socket.IO events for real-time collaboration:

- Room management (join/leave)
- Code synchronization
- Document collaboration
- Whiteboard drawing
- Chat messaging
- User presence tracking

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Beautiful dark theme throughout the application
- **Gradient Backgrounds**: Modern gradient designs for visual appeal
- **Smooth Animations**: Framer Motion powered transitions
- **Loading States**: Visual feedback for user actions
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: Built with accessibility best practices

## 🔒 Security Features

- **Authentication Required**: Home page and rooms require authentication
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: Secure password storage with bcrypt
- **CORS Protection**: Configured cross-origin resource sharing
- **Input Validation**: Server-side validation for all inputs
- **Session Management**: Secure session handling

## 🚀 Deployment

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `dist` folder to your preferred hosting service

### Backend Deployment

1. Set up environment variables on your server
2. Install dependencies and start the server:
   ```bash
   cd backend
   npm install
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Avi-GG**

- GitHub: [@Avi-GG](https://github.com/Avi-GG)

## 🙏 Acknowledgments

- Monaco Editor for the excellent code editing experience
- Quill.js for rich text editing capabilities
- Socket.IO for seamless real-time communication
- Piston API for code execution functionality
- Chakra UI and Tailwind CSS for the beautiful UI components

---

**SyncVerse** - Where collaboration meets innovation! 🚀
