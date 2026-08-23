# 🤖 ARIOS — AI Assistant

**ARIOS** is a general-purpose AI assistant built with **React, FastAPI, Google ADK, and Gemini**.

It provides a modern chatbot interface for asking questions, solving problems, performing calculations, explaining concepts, and assisting with coding.

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

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Google ADK
- Google Gen AI

### AI

- Google Gemini

---

## 🏗️ Architecture

```text
                         🌎 USER
                           │
                           ▼
              ┌────────────────────────┐
              │      React + Vite      │
              │       Frontend         │
              │       Vercel           │
              └───────────┬────────────┘
                          │
                     HTTPS / REST
                          │
                          ▼
              ┌────────────────────────┐
              │        FastAPI         │
              │        Backend         │
              │        Render          │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │      Google ADK        │
              │      ARIOS Agent       │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │        Gemini          │
              │      Language Model    │
              └────────────────────────┘
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
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

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

- [ ] Persistent conversation history
- [ ] User authentication
- [ ] Markdown rendering
- [ ] Code syntax highlighting
- [ ] Voice input and output
- [ ] File uploads
- [ ] Web search
- [ ] Additional AI tools
- [ ] Dark/light theme
- [ ] Mobile optimization
- [ ] Streaming AI responses
- [ ] Conversation memory
- [ ] Custom AI personas

---
 
## 👨‍💻 Author

Aryan Sharma

---

## 📄 License

This project is currently intended as a personal and educational project.
