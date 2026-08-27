import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

const API_URL = "https://arios-backend.onrender.com";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [taskProgress, setTaskProgress] = useState(0);
  const [taskStatus, setTaskStatus] = useState("Preparing task...");

  const [chatHistory, setChatHistory] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* --------------------------------------------------
     Load chat history
  -------------------------------------------------- */

  useEffect(() => {
    const savedChats = localStorage.getItem("arios_chats");

    if (savedChats) {
      try {
        setChatHistory(JSON.parse(savedChats));
      } catch {
        setChatHistory([]);
      }
    }
  }, []);

  /* --------------------------------------------------
     Save chat history
  -------------------------------------------------- */

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(
        "arios_chats",
        JSON.stringify(chatHistory)
      );
    }
  }, [chatHistory]);

  /* --------------------------------------------------
     Save current conversation
  -------------------------------------------------- */

  const saveCurrentChat = (currentMessages) => {
    if (!currentMessages.length) return;

    const firstUserMessage = currentMessages.find(
      (message) => message.role === "user"
    );

    const title = firstUserMessage
      ? firstUserMessage.content.slice(0, 35)
      : "New conversation";

    const chat = {
      id: Date.now(),
      title,
      messages: currentMessages,
    };

    setChatHistory((current) => {
      const updated = [
        chat,
        ...current.filter((item) => item.title !== title),
      ];

      return updated.slice(0, 10);
    });
  };

  /* --------------------------------------------------
     New chat
  -------------------------------------------------- */

  const newChat = () => {
    if (messages.length > 0) {
      saveCurrentChat(messages);
    }

    setMessages([]);
    setInput("");
    setLoading(false);
    setTaskProgress(0);
    setTaskStatus("Preparing task...");
    setActivePanel(null);
    setMenuOpen(false);
  };

  /* --------------------------------------------------
     Load previous chat
  -------------------------------------------------- */

  const loadChat = (chat) => {
    if (loading) return;

    setMessages(chat.messages);
    setInput("");
    setActivePanel(null);
    setMenuOpen(false);
  };

  /* --------------------------------------------------
     Send message
  -------------------------------------------------- */

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setTaskProgress(5);
    setTaskStatus("Sending task to ARIOS...");

    try {
      /* --------------------------------------------------
         Create task
      -------------------------------------------------- */

      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const task = await response.json();

      setTaskProgress(10);
      setTaskStatus("Task received");

      let completed = false;

      /* --------------------------------------------------
         Poll task status
      -------------------------------------------------- */

      while (!completed) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1200)
        );

        const statusResponse = await fetch(
          `${API_URL}/tasks/${task.task_id}`
        );

        if (!statusResponse.ok) {
          throw new Error("Failed to check task status");
        }

        const status = await statusResponse.json();

        const progress =
          typeof status.progress === "number"
            ? status.progress
            : 0;

        setTaskProgress(progress);

        if (status.status === "queued") {
          setTaskStatus("Task queued");
        } else if (status.status === "planning") {
          setTaskStatus("Planning your task");
        } else if (status.status === "working") {
          setTaskStatus("ARIOS is working");
        } else if (status.status === "completed") {
          setTaskProgress(100);
          setTaskStatus("Task completed");

          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content:
                status.result || "Task completed.",
            },
          ]);

          completed = true;
        }

        if (status.status === "failed") {
          throw new Error(
            status.error ||
              "ARIOS could not complete the task."
          );
        }
      }
    } catch (error) {
      console.error(error);

      setTaskProgress(0);
      setTaskStatus("Something went wrong");

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't complete this task. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     Keyboard handling
  -------------------------------------------------- */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  /* --------------------------------------------------
     Suggestions
  -------------------------------------------------- */

  const useSuggestion = (text) => {
    setInput(text);
    setActivePanel(null);

    setTimeout(() => {
      document.querySelector(".chat-input")?.focus();
    }, 50);
  };

  /* --------------------------------------------------
     Clear history
  -------------------------------------------------- */

  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("arios_chats");
  };

  return (
    <div className="app">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="sidebar">

        <div className="sidebar-top">

          {/* Logo */}

          <div className="logo">

            <div className="logo-mark">
              ◈
            </div>

            <div className="logo-copy">
              <div className="logo-text">
                ARIOS
              </div>

              <div className="logo-subtitle">
                AI TASKMASTER
              </div>
            </div>

          </div>

          {/* New Chat */}

          <button
            className="new-chat"
            onClick={newChat}
          >
            <span className="new-chat-icon">
              ＋
            </span>

            <span>
              New Chat
            </span>
          </button>

          {/* Recent Chats */}

          <div className="chat-history">

            <div className="history-header">

              <p className="history-title">
                RECENT CHATS
              </p>

              {chatHistory.length > 0 && (
                <button
                  className="clear-history"
                  onClick={clearHistory}
                >
                  Clear
                </button>
              )}

            </div>

            {chatHistory.length === 0 ? (

              <div className="empty-history">

                <span className="empty-history-icon">
                  ◌
                </span>

                <p>
                  No recent chats
                </p>

                <span>
                  Start a conversation
                </span>

              </div>

            ) : (

              <div className="history-list">

                {chatHistory.map((chat) => (

                  <button
                    className="chat-item"
                    key={chat.id}
                    onClick={() => loadChat(chat)}
                  >

                    <span className="chat-item-icon">
                      ◈
                    </span>

                    <span className="chat-item-title">
                      {chat.title}
                    </span>

                  </button>

                ))}

              </div>

            )}

          </div>

        </div>

        {/* Sidebar Bottom */}

        <div className="sidebar-bottom">

          <button
            onClick={() => {
              setActivePanel("settings");
              setMenuOpen(false);
            }}
          >
            <span>
              ⚙
            </span>

            Settings
          </button>

          <button
            onClick={() => {
              setActivePanel("about");
              setMenuOpen(false);
            }}
          >
            <span>
              ⓘ
            </span>

            About ARIOS
          </button>

        </div>

      </aside>


      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="main">

        {/* Header */}

        <header className="header">

          <div className="mobile-logo">

            <span>
              ◈
            </span>

            <strong>
              ARIOS
            </strong>

          </div>

          <div className="header-status">

            <span className="status-dot"></span>

            <span>
              Online
            </span>

          </div>

          <div className="header-actions">

            <button
              className="header-new-chat"
              onClick={newChat}
            >
              <span>
                ＋
              </span>

              New Chat
            </button>

            <div className="menu-container">

              <button
                className="icon-button"
                onClick={() =>
                  setMenuOpen(!menuOpen)
                }
              >
                ⋯
              </button>

              {menuOpen && (

                <div className="dropdown-menu">

                  <button
                    onClick={() => {
                      setActivePanel("settings");
                      setMenuOpen(false);
                    }}
                  >
                    ⚙ Settings
                  </button>

                  <button
                    onClick={() => {
                      setActivePanel("about");
                      setMenuOpen(false);
                    }}
                  >
                    ⓘ About ARIOS
                  </button>

                  <div className="menu-divider"></div>

                  <button onClick={newChat}>
                    ＋ New Chat
                  </button>

                </div>

              )}

            </div>

          </div>

        </header>


        {/* ==================================================
            CHAT AREA
        ================================================== */}

        <section className="chat-container">

          {/* --------------------------------------------------
              WELCOME SCREEN
          -------------------------------------------------- */}

          {messages.length === 0 && (

            <div className="welcome">

              <div className="ai-icon">

                <div className="ai-icon-glow"></div>

                <span>
                  ◈
                </span>

              </div>

              <div className="welcome-badge">

                <span className="status-dot"></span>

                ARIOS is ready

              </div>

              <h1>
                How can I help you?
              </h1>

              <p className="welcome-description">
                I'm ARIOS, your intelligent AI taskmaster.
                <br />
                Give me a task and I'll work on it for you.
              </p>


              {/* Suggestions */}

              <div className="suggestions">

                <button
                  className="suggestion-card"
                  onClick={() =>
                    useSuggestion(
                      "Explain data structures simply"
                    )
                  }
                >

                  <div className="suggestion-icon">
                    ✦
                  </div>

                  <div className="suggestion-text">

                    <strong>
                      Explain something
                    </strong>

                    <span>
                      Break down a concept clearly
                    </span>

                  </div>

                  <span className="suggestion-arrow">
                    →
                  </span>

                </button>


                <button
                  className="suggestion-card"
                  onClick={() =>
                    useSuggestion(
                      "Create a study plan for data structures"
                    )
                  }
                >

                  <div className="suggestion-icon">
                    ◫
                  </div>

                  <div className="suggestion-text">

                    <strong>
                      Create a plan
                    </strong>

                    <span>
                      Build a structured plan for me
                    </span>

                  </div>

                  <span className="suggestion-arrow">
                    →
                  </span>

                </button>


                <button
                  className="suggestion-card"
                  onClick={() =>
                    useSuggestion(
                      "Calculate 25 × 48 and explain the result"
                    )
                  }
                >

                  <div className="suggestion-icon">
                    ⌘
                  </div>

                  <div className="suggestion-text">

                    <strong>
                      Calculate something
                    </strong>

                    <span>
                      Get accurate results quickly
                    </span>

                  </div>

                  <span className="suggestion-arrow">
                    →
                  </span>

                </button>

              </div>

            </div>

          )}


          {/* --------------------------------------------------
              MESSAGES
          -------------------------------------------------- */}

          {messages.length > 0 && (

            <div className="messages">

              {messages.map((message, index) => (

                <div
                  className={`message-row ${message.role}`}
                  key={index}
                >

                  <div className="message-avatar">

                    {message.role === "assistant" ? (
                      <span>
                        ◈
                      </span>
                    ) : (
                      <span>
                        You
                      </span>
                    )}

                  </div>

                  <div className="message-content">

                    {message.role === "assistant" ? (

                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                      >
                        {message.content}
                      </ReactMarkdown>

                    ) : (

                      message.content

                    )}

                  </div>

                </div>

              ))}


              {/* --------------------------------------------------
                  AGENT WORKING CARD
              -------------------------------------------------- */}

              {loading && (

                <div className="message-row assistant">

                  <div className="message-avatar">

                    <span>
                      ◈
                    </span>

                  </div>


                  <div className="agent-card">

                    {/* Top */}

                    <div className="agent-card-header">

                      <div className="agent-identity">

                        <div className="agent-pulse">
                          <span></span>
                        </div>

                        <div>

                          <strong>
                            ARIOS
                          </strong>

                          <span>
                            AUTONOMOUS TASK
                          </span>

                        </div>

                      </div>

                      <div className="agent-percentage">
                        {taskProgress}%
                      </div>

                    </div>


                    {/* Progress */}

                    <div className="agent-progress-track">

                      <div
                        className="agent-progress-fill"
                        style={{
                          width: `${taskProgress}%`,
                        }}
                      >

                        <div className="progress-shine"></div>

                      </div>

                    </div>


                    {/* Steps */}

                    <div className="agent-steps">

                      <div
                        className={
                          taskProgress >= 10
                            ? "agent-step active"
                            : "agent-step"
                        }
                      >

                        <span>
                          {taskProgress >= 10
                            ? "✓"
                            : "○"}
                        </span>

                        Planning

                      </div>


                      <div
                        className={
                          taskProgress >= 30
                            ? "agent-step active"
                            : "agent-step"
                        }
                      >

                        <span>
                          {taskProgress >= 30
                            ? "✓"
                            : "○"}
                        </span>

                        Executing

                      </div>


                      <div
                        className={
                          taskProgress >= 100
                            ? "agent-step active"
                            : "agent-step"
                        }
                      >

                        <span>
                          {taskProgress >= 100
                            ? "✓"
                            : "○"}
                        </span>

                        Finishing

                      </div>

                    </div>


                    {/* Status */}

                    <div className="agent-status">

                      <span className="agent-status-dot"></span>

                      <span>
                        {taskStatus}
                      </span>

                      <span className="agent-status-dots">
                        •••
                      </span>

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}


          {/* --------------------------------------------------
              INPUT
          -------------------------------------------------- */}

          <div className="input-area">

            <div className="input-wrapper">

              <textarea
                className="chat-input"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Message ARIOS..."
                rows="1"
                disabled={loading}
              />

              <button
                className="send-button"
                onClick={sendMessage}
                disabled={
                  loading ||
                  !input.trim()
                }
                title="Send message"
              >
                ↑
              </button>

            </div>

            <p className="disclaimer">
              ARIOS can make mistakes. Check important information.
            </p>

          </div>

        </section>


        {/* ==================================================
            SETTINGS
        ================================================== */}

        {activePanel === "settings" && (

          <div
            className="overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setActivePanel(null);
              }
            }}
          >

            <div className="panel">

              <div className="panel-header">

                <div>

                  <span className="panel-label">
                    ARIOS
                  </span>

                  <h2>
                    Settings
                  </h2>

                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setActivePanel(null)
                  }
                >
                  ×
                </button>

              </div>


              <div className="setting-item">

                <div>

                  <strong>
                    AI Taskmaster
                  </strong>

                  <p>
                    ARIOS handles your requests through
                    its autonomous task system.
                  </p>

                </div>

                <span className="setting-status">
                  Active
                </span>

              </div>


              <div className="setting-item">

                <div>

                  <strong>
                    Chat History
                  </strong>

                  <p>
                    Conversations are saved locally in
                    this browser.
                  </p>

                </div>

                <span className="setting-status">
                  Local
                </span>

              </div>


              <button
                className="panel-danger"
                onClick={clearHistory}
              >
                Clear All Chat History
              </button>

            </div>

          </div>

        )}


        {/* ==================================================
            ABOUT
        ================================================== */}

        {activePanel === "about" && (

          <div
            className="overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setActivePanel(null);
              }
            }}
          >

            <div className="panel about-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-label">
                    ABOUT
                  </span>

                  <h2>
                    ARIOS
                  </h2>

                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setActivePanel(null)
                  }
                >
                  ×
                </button>

              </div>


              <div className="about-logo">
                ◈
              </div>

              <h3>
                Autonomous Reasoning &amp;
                Intelligence Operating System
              </h3>

              <p>
                ARIOS is a general-purpose AI taskmaster
                designed to understand requests, execute
                tasks asynchronously, and return useful
                results.
              </p>


              <div className="about-tags">

                <span>
                  Google ADK
                </span>

                <span>
                  Gemini
                </span>

                <span>
                  FastAPI
                </span>

                <span>
                  Firestore
                </span>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default App;
