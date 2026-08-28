import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

const API_URL = "https://arios-backend.onrender.com";

const STATUS_STEPS = [
  { key: "queued", label: "Request received" },
  { key: "planning", label: "Planning task" },
  { key: "working", label: "Executing task" },
  { key: "completed", label: "Task completed" },
];

function App() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [taskStatus, setTaskStatus] = useState("queued");
  const [taskProgress, setTaskProgress] = useState(0);

  const [chatHistory, setChatHistory] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* -----------------------------
     Load history
  ----------------------------- */

  useEffect(() => {
    try {
      const saved = localStorage.getItem("arios_chats");

      if (saved) {
        setChatHistory(JSON.parse(saved));
      }
    } catch {
      setChatHistory([]);
    }
  }, []);

  /* -----------------------------
     Save history
  ----------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "arios_chats",
      JSON.stringify(chatHistory)
    );
  }, [chatHistory]);

  /* -----------------------------
     Auto scroll
  ----------------------------- */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, taskProgress]);

  /* -----------------------------
     Auto resize textarea
  ----------------------------- */

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";

    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      160
    )}px`;
  }, [input]);

  /* -----------------------------
     Save current conversation
  ----------------------------- */

  const saveCurrentChat = (currentMessages) => {
    if (!currentMessages.length) return;

    const firstUser = currentMessages.find(
      (message) => message.role === "user"
    );

    const title = firstUser
      ? firstUser.content.slice(0, 42)
      : "New conversation";

    const chat = {
      id: Date.now(),
      title,
      messages: currentMessages,
    };

    setChatHistory((current) => {
      const filtered = current.filter(
        (item) => item.title !== title
      );

      return [chat, ...filtered].slice(0, 10);
    });
  };

  /* -----------------------------
     New chat
  ----------------------------- */

  const newChat = () => {
    if (messages.length > 0 && !loading) {
      saveCurrentChat(messages);
    }

    setMessages([]);
    setInput("");
    setLoading(false);
    setTaskStatus("queued");
    setTaskProgress(0);
    setActivePanel(null);
    setMenuOpen(false);
    setMobileSidebar(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  /* -----------------------------
     Load chat
  ----------------------------- */

  const loadChat = (chat) => {
    if (loading) return;

    setMessages(chat.messages);
    setInput("");
    setTaskStatus("completed");
    setTaskProgress(100);
    setActivePanel(null);
    setMenuOpen(false);
    setMobileSidebar(false);
  };

  /* -----------------------------
     Clear history
  ----------------------------- */

  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("arios_chats");
  };

  /* -----------------------------
     Poll task
  ----------------------------- */

  const pollTask = async (taskId) => {
    const maxAttempts = 120;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      const response = await fetch(
        `${API_URL}/tasks/${taskId}`
      );

      if (!response.ok) {
        throw new Error("Unable to check task status.");
      }

      const task = await response.json();

      setTaskStatus(task.status || "working");

      if (typeof task.progress === "number") {
        setTaskProgress(task.progress);
      }

      if (task.status === "completed") {
        return task;
      }

      if (task.status === "failed") {
        throw new Error(
          task.error || "ARIOS could not complete the task."
        );
      }
    }

    throw new Error(
      "The task is taking longer than expected."
    );
  };

  /* -----------------------------
     Send message
  ----------------------------- */

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setLoading(true);
    setTaskStatus("queued");
    setTaskProgress(0);

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          "ARIOS could not create the task."
        );
      }

      const task = await response.json();

      setTaskStatus(task.status || "queued");

      const completedTask = await pollTask(
        task.task_id
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            completedTask.result ||
            "Task completed successfully.",
          timestamp: new Date().toISOString(),
        },
      ]);

      setTaskStatus("completed");
      setTaskProgress(100);
    } catch (error) {
      console.error(error);

      setTaskStatus("failed");
      setTaskProgress(0);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          error: true,
          content:
            "I couldn't complete that task.\n\n" +
            `**Reason:** ${
              error.message || "Something went wrong."
            }`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  /* -----------------------------
     Keyboard
  ----------------------------- */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  /* -----------------------------
     Suggestions
  ----------------------------- */

  const useSuggestion = (text) => {
    setInput(text);
    setActivePanel(null);
    setMenuOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  /* -----------------------------
     Copy response
  ----------------------------- */

  const copyMessage = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);

      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 1600);
    } catch (error) {
      console.error(error);
    }
  };

  /* -----------------------------
     Retry
  ----------------------------- */

  const retryLastMessage = () => {
    if (loading) return;

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage) return;

    setInput(lastUserMessage.content);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  /* -----------------------------
     Status helpers
  ----------------------------- */

  const getStatusLabel = () => {
    switch (taskStatus) {
      case "queued":
        return "Request received";

      case "planning":
        return "Planning your task";

      case "working":
        return "ARIOS is working";

      case "completed":
        return "Task completed";

      case "failed":
        return "Task failed";

      default:
        return "Working";
    }
  };

  const getActiveStep = () => {
    if (taskStatus === "queued") return 0;
    if (taskStatus === "planning") return 1;
    if (taskStatus === "working") return 2;
    if (taskStatus === "completed") return 3;

    return 0;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    try {
      return new Date(timestamp).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "";
    }
  };

  /* -----------------------------
     Render
  ----------------------------- */

  return (
    <div className="app-shell">

      {/* Mobile backdrop */}

      {mobileSidebar && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* =========================================
          SIDEBAR
      ========================================== */}

      <aside
        className={`sidebar ${
          mobileSidebar ? "sidebar-open" : ""
        }`}
      >

        <div className="sidebar-inner">

          {/* Brand */}

          <div className="brand">
            <div className="brand-mark">
              <span>◈</span>
            </div>

            <div className="brand-copy">
              <div className="brand-name">
                ARIOS
              </div>

              <div className="brand-caption">
                AI TASKMASTER
              </div>
            </div>
          </div>

          {/* New chat */}

          <button
            className="new-chat-button"
            onClick={newChat}
          >
            <span className="new-chat-plus">
              +
            </span>

            <span>New conversation</span>

            <span className="new-chat-shortcut">
              ⌘ K
            </span>
          </button>

          {/* History */}

          <div className="history-section">

            <div className="section-heading">
              <span>RECENT</span>

              {chatHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="clear-button"
                >
                  Clear
                </button>
              )}
            </div>

            {chatHistory.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">
                  ◌
                </div>

                <span>
                  Your conversations will appear here.
                </span>
              </div>
            ) : (
              <div className="history-list">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className="history-item"
                    onClick={() => loadChat(chat)}
                  >
                    <span className="history-icon">
                      ◈
                    </span>

                    <span className="history-title">
                      {chat.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Sidebar bottom */}

        <div className="sidebar-footer">

          <button
            className="sidebar-action"
            onClick={() =>
              setActivePanel("settings")
            }
          >
            <span>⚙</span>
            <span>Settings</span>
          </button>

          <button
            className="sidebar-action"
            onClick={() =>
              setActivePanel("about")
            }
          >
            <span>ⓘ</span>
            <span>About ARIOS</span>
          </button>

          <div className="sidebar-version">
            <span className="online-dot" />
            ARIOS online
            <span>v1.0</span>
          </div>

        </div>

      </aside>

      {/* =========================================
          MAIN
      ========================================== */}

      <main className="main">

        {/* Header */}

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="mobile-menu-button"
              onClick={() =>
                setMobileSidebar(true)
              }
            >
              ☰
            </button>

            <div className="conversation-label">

              <span className="conversation-kicker">
                WORKSPACE
              </span>

              <span className="conversation-name">
                {messages.length
                  ? "Current conversation"
                  : "New conversation"}
              </span>

            </div>

          </div>

          <div className="topbar-right">

            <div className="online-status">
              <span className="online-dot" />
              <span>Operational</span>
            </div>

            <button
              className="topbar-new"
              onClick={newChat}
            >
              <span>+</span>
              New
            </button>

            <button
              className="topbar-menu"
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="dropdown">

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

                <div className="dropdown-line" />

                <button onClick={newChat}>
                  + New conversation
                </button>

              </div>
            )}

          </div>

        </header>

        {/* =========================================
            CHAT AREA
        ========================================== */}

        <section className="chat-area">

          {messages.length === 0 ? (

            /* =====================================
               EMPTY STATE
            ====================================== */

            <div className="empty-state">

              <div className="hero-orb">

                <div className="orb-ring ring-one" />
                <div className="orb-ring ring-two" />

                <div className="orb-core">
                  ◈
                </div>

              </div>

              <div className="ready-pill">
                <span className="online-dot" />
                ARIOS is ready
              </div>

              <h1>
                What should I
                <span> get done?</span>
              </h1>

              <p className="hero-description">
                Give ARIOS a task. It will plan the
                work, execute it, and return the result.
              </p>

              <div className="suggestion-grid">

                <button
                  className="suggestion"
                  onClick={() =>
                    useSuggestion(
                      "Explain recursion simply with an example"
                    )
                  }
                >
                  <div className="suggestion-symbol">
                    ✦
                  </div>

                  <div>
                    <strong>
                      Explain a concept
                    </strong>

                    <span>
                      Make something difficult easy
                    </span>
                  </div>

                  <b>↗</b>
                </button>

                <button
                  className="suggestion"
                  onClick={() =>
                    useSuggestion(
                      "Create a 7-day study plan for data structures"
                    )
                  }
                >
                  <div className="suggestion-symbol">
                    ◫
                  </div>

                  <div>
                    <strong>
                      Build a plan
                    </strong>

                    <span>
                      Turn a goal into clear steps
                    </span>
                  </div>

                  <b>↗</b>
                </button>

                <button
                  className="suggestion"
                  onClick={() =>
                    useSuggestion(
                      "Calculate 25 × 48 and explain the calculation"
                    )
                  }
                >
                  <div className="suggestion-symbol">
                    ∑
                  </div>

                  <div>
                    <strong>
                      Solve something
                    </strong>

                    <span>
                      Calculate and explain the answer
                    </span>
                  </div>

                  <b>↗</b>
                </button>

              </div>

            </div>

          ) : (

            /* =====================================
               MESSAGES
            ====================================== */

            <div className="messages-wrapper">

              <div className="messages">

                {messages.map(
                  (message, index) => (

                    <div
                      key={index}
                      className={`message ${
                        message.role
                      }`}
                    >

                      {message.role ===
                      "assistant" ? (

                        <div className="assistant-avatar">
                          ◈
                        </div>

                      ) : (
                        <div className="user-avatar">
                          YOU
                        </div>
                      )}

                      <div className="message-main">

                        <div className="message-meta">

                          <strong>
                            {message.role ===
                            "assistant"
                              ? "ARIOS"
                              : "You"}
                          </strong>

                          <span>
                            {formatTime(
                              message.timestamp
                            )}
                          </span>

                        </div>

                        <div
                          className={`message-body ${
                            message.error
                              ? "message-error"
                              : ""
                          }`}
                        >

                          {message.role ===
                          "assistant" ? (
                            <ReactMarkdown
                              remarkPlugins={[
                                remarkGfm,
                              ]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          ) : (
                            <p>
                              {message.content}
                            </p>
                          )}

                        </div>

                        {message.role ===
                          "assistant" && (
                          <div className="message-actions">

                            <button
                              onClick={() =>
                                copyMessage(
                                  message.content,
                                  index
                                )
                              }
                            >
                              {copiedIndex ===
                              index
                                ? "✓ Copied"
                                : "Copy"}
                            </button>

                            {message.error && (
                              <button
                                onClick={
                                  retryLastMessage
                                }
                              >
                                Retry
                              </button>
                            )}

                          </div>
                        )}

                      </div>

                    </div>

                  )
                )}

                {/* =================================
                    AGENT WORK CARD
                ================================== */}

                {loading && (
                  <div className="agent-work">

                    <div className="work-icon">
                      <div className="work-pulse">
                        ◈
                      </div>
                    </div>

                    <div className="work-content">

                      <div className="work-header">

                        <div>
                          <strong>
                            {getStatusLabel()}
                          </strong>

                          <span>
                            ARIOS autonomous task
                          </span>
                        </div>

                        <span className="work-percent">
                          {taskProgress}%
                        </span>

                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(
                              taskProgress,
                              4
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="work-steps">

                        {STATUS_STEPS.map(
                          (step, index) => {

                            const active =
                              getActiveStep();

                            const completed =
                              index < active;

                            const current =
                              index === active;

                            return (
                              <div
                                key={step.key}
                                className={`work-step ${
                                  completed
                                    ? "complete"
                                    : ""
                                } ${
                                  current
                                    ? "current"
                                    : ""
                                }`}
                              >

                                <span className="step-dot">
                                  {completed
                                    ? "✓"
                                    : current
                                    ? "•"
                                    : ""}
                                </span>

                                <span>
                                  {step.label}
                                </span>

                              </div>
                            );
                          }
                        )}

                      </div>

                    </div>

                  </div>
                )}

                <div ref={messagesEndRef} />

              </div>

            </div>

          )}

          {/* =======================================
              COMPOSER
          ======================================== */}

          <div className="composer-zone">

            <div className="composer">

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  loading
                    ? "ARIOS is working..."
                    : "Give ARIOS a task..."
                }
                rows={1}
                disabled={loading}
              />

              <div className="composer-bottom">

                <div className="composer-info">

                  <span className="composer-ai">
                    ◈
                  </span>

                  <span>
                    {loading
                      ? "Autonomous task in progress"
                      : "ARIOS can plan and execute tasks"}
                  </span>

                </div>

                <div className="composer-actions">

                  <span className="enter-hint">
                    Enter ↵
                  </span>

                  <button
                    className="send-button"
                    onClick={sendMessage}
                    disabled={
                      loading ||
                      !input.trim()
                    }
                    aria-label="Send message"
                  >
                    ↑
                  </button>

                </div>

              </div>

            </div>

            <p className="composer-disclaimer">
              ARIOS can make mistakes. Verify important
              information.
            </p>

          </div>

        </section>

        {/* =========================================
            SETTINGS
        ========================================== */}

        {activePanel === "settings" && (
          <div
            className="modal-backdrop"
            onClick={() =>
              setActivePanel(null)
            }
          >
            <div
              className="modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <span>ARIOS</span>
                  <h2>Settings</h2>
                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setActivePanel(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="setting-card">

                <div className="setting-icon">
                  ◈
                </div>

                <div>
                  <strong>
                    Autonomous taskmaster
                  </strong>

                  <p>
                    ARIOS receives your request,
                    creates a background task, and
                    executes it through the agent.
                  </p>
                </div>

                <span className="setting-badge">
                  ACTIVE
                </span>

              </div>

              <div className="setting-card">

                <div className="setting-icon">
                  ◷
                </div>

                <div>
                  <strong>
                    Local chat history
                  </strong>

                  <p>
                    Your recent conversations are
                    stored locally in this browser.
                  </p>
                </div>

                <span className="setting-badge">
                  LOCAL
                </span>

              </div>

              <button
                className="danger-button"
                onClick={clearHistory}
              >
                Clear all chat history
              </button>

            </div>
          </div>
        )}

        {/* =========================================
            ABOUT
        ========================================== */}

        {activePanel === "about" && (
          <div
            className="modal-backdrop"
            onClick={() =>
              setActivePanel(null)
            }
          >
            <div
              className="modal about-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <span>ABOUT</span>
                  <h2>ARIOS</h2>
                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setActivePanel(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="about-mark">
                ◈
              </div>

              <h3>
                Autonomous Reasoning &
                <br />
                Intelligence Operating System
              </h3>

              <p>
                ARIOS is a general-purpose AI
                taskmaster designed to understand
                requests, execute tasks asynchronously,
                and return useful results.
              </p>

              <div className="tech-stack">

                <span>Google ADK</span>
                <span>Gemini</span>
                <span>FastAPI</span>
                <span>Firestore</span>
                <span>React</span>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
