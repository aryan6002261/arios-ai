# 🤖 ARIOS — Autonomous AI Taskmaster

**ARIOS** is a general-purpose AI assistant built with **React, FastAPI, Google ADK, and Gemini**.

ARIOS is an autonomous AI taskmaster built to understand user requests, execute them asynchronously, track task progress, and return results through a modern web interface.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://arios-ai.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/aryan6002261/arios-ai)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)

---

## 🖥️ Preview

![ARIOS Preview](https://files.catbox.moe/w5adwr.png)

---

## 🌐 Live Demo

### 👉 [Try ARIOS](https://arios-ai.vercel.app/)

ARIOS is publicly deployed and accessible through the web.

---

## ✨ Features

- 💬 Conversational AI chatbot
- 🧠 Powered by Google's Gemini
- 🧮 Mathematical calculation tool
- 💻 Coding and problem-solving assistance
- 📚 Concept explanations
- ⚡ Fast React-based interface
- 🔌 REST API powered by FastAPI
- ☁️ Cloud-deployed backend
- 🌐 Public web application
- 🔄 Automatic deployment through GitHub
- 🤖 Autonomous task execution
- ⚡ Asynchronous background task processing
- 📊 Real-time task status and progress tracking
- 🧠 Google Gemini-powered reasoning
- 🔗 Google ADK agent architecture
- 💾 Firestore integration
- 💬 Persistent local chat history
- 📝 Markdown + GitHub Flavored Markdown rendering
- 📱 Responsive web interface
- ⚙️ Task and system status handling
- 🔌 REST API architecture
- 🛡️ Graceful AI/API error handling

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Firebase SDK

### Backend
- Python
- FastAPI
- Uvicorn
- Google ADK
- Google Gen AI

### Database
- Google Cloud Firestore

### AI
- Google Gemini
- Google ADK

---

## 🏗️ Architecture

```text
                         🌎 USER
                            │
                            ▼
                 ┌─────────────────────┐
                 │    React + Vite     │
                 │      Frontend       │
                 │       Vercel        │
                 └──────────┬──────────┘
                            │
                       HTTPS / REST
                            │
                            ▼
                 ┌─────────────────────┐
                 │       FastAPI       │
                 │      Backend        │
                 │       Render        │
                 └──────┬───────┬──────┘
                        │       │
                 Task System     │
                        │        │
                        ▼        ▼
              ┌────────────┐  ┌──────────────┐
              │ Google ADK │  │  Firestore   │
              │ ARIOS Agent│  │   Database   │
              └──────┬─────┘  └──────────────┘
                     │
                     ▼
              ┌────────────┐
              │   Gemini   │
              │     AI     │
              └────────────┘
```

---

## 📁 Project Structure

```text
arios-ai/
│
├── arios_agent/
│   ├── __init__.py
│   └── agent.py
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── firebase.js
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile
├── .gitignore
└── README.md
```

---

## 🔌 API

### Health Check
GET /

### Chat
POST /chat

### Create Task
POST /tasks

### Get Task Status
GET /tasks/{task_id}

---

## 🧠 How ARIOS Works

1. The user submits a task through the React frontend.
2. The frontend sends the request to the FastAPI backend.
3. FastAPI creates an autonomous task and returns a unique task ID.
4. ARIOS processes the request using Google ADK and Gemini.
5. Task progress and status are tracked by the backend.
6. The frontend polls the task endpoint for updates.
7. Once completed, the generated result is returned to the user.
8. Firestore provides persistent cloud data storage.

---

## ☁️ Deployment

### Frontend
The frontend is deployed using Vercel.

### Backend
The FastAPI backend is deployed using Render.

### Source Control
The project is maintained using GitHub.

The deployment pipeline is:

```text
GitHub
   │
   ├── Frontend → Vercel
   │
   └── Backend → Render
```

---
   
## 🔮 Future Improvements

- [ ] User authentication
- [ ] File uploads
- [ ] Web search
- [ ] Voice interaction
- [ ] Long-term conversation memory
- [ ] Custom AI tools
- [ ] Streaming responses
- [ ] Multi-user task management
- [ ] Task completion notifications

---

## ⚠️ Current Limitations

ARIOS currently relies on the available Gemini API quota. During periods of high usage, AI requests may temporarily fail when the configured API quota is exhausted.

The application handles these failures gracefully and allows the user to retry later.

---
 
## 👨‍💻 Author

Aryan Sharma

---

## 📄 License

This project is currently intended as a personal and educational project.
