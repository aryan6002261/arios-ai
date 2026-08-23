import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://arios-backend.onrender.com";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    setTaskStatus("queued");

    try {
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
        throw new Error("Server error");
      }

      const task = await response.json();

      await monitorTask(task.task_id);
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the ARIOS server.",
        },
      ]);

      setTaskStatus("failed");
      setLoading(false);
    }
  };

  const monitorTask = async (taskId) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/tasks/${taskId}`
        );

        if (!response.ok) {
          throw new Error("Could not check task status");
        }

        const task = await response.json();

        setTaskStatus(task.status);

        if (task.status === "completed") {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: task.result || "Task completed.",
            },
          ]);

          setLoading(false);
          return;
        }

        if (task.status === "failed") {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content:
                "ARIOS couldn't complete this task. Please try again.",
            },
          ]);

          setLoading(false);
          return;
        }

        setTimeout(checkStatus, 1500);
      } catch (error) {
        console.error(error);

        setTaskStatus("failed");
        setLoading(false);

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't check the ARIOS task status.",
          },
        ]);
      }
    };

    checkStatus();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setTaskStatus(null);
    setLoading(false);
  };

  const getStatusText = () => {
    switch (taskStatus) {
      case "queued":
        return "ARIOS is preparing your task...";
      case "planning":
        return "🧠 ARIOS is planning...";
      case "working":
        return "⚙️ ARIOS is working...";
      case "completed":
        return "✓ Task completed";
      case "failed":
        return "Task failed";
      default:
        return "";
    }
  };

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          <span className="logo-mark">◈</span>
          <span>ARIOS</span>
        </div>

        <button className="new-chat" onClick={newChat}>
          <span>＋</span>
          New Chat
        </button>

        <div className="chat-history">
          <p className="history-title">RECENT CHATS</p>

          {messages.length > 0 && (
            <button className="chat-item">
              Current task
            </button>
          )}
        </div>

        <div className="sidebar-bottom">
          <button>⚙ Settings</button>
          <button>ⓘ About ARIOS</button>
        </div>

      </aside>

      {/* Main */}
      <main className="main">

        <header className="header">

          <div className="mobile-logo">
            ◈ ARIOS
          </div>

          <div className="header-actions">

            <button onClick={newChat}>
              New Chat
            </button>

            <button className="icon-button">
              ⋯
            </button>

          </div>

        </header>

        <section className="chat-container">

          {/* Welcome */}
          {messages.length === 0 && !loading && (
            <div className="welcome">

              <div className="ai-icon">
                ◈
              </div>

              <h1>What should I accomplish?</h1>

              <p>
                I'm ARIOS, your autonomous AI taskmaster.
                Give me a goal and I'll work through it.
              </p>

            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="messages">

              {messages.map((message, index) => (
                <div
                  className={`message-row ${message.role}`}
                  key={index}
                >

                  <div className="message-avatar">
                    {message.role === "assistant"
                      ? "◈"
                      : "You"}
                  </div>

                  <div className="message-content">
                    {message.content}
                  </div>

                </div>
              ))}

              {/* Task status */}
              {loading && (
                <div className="message-row assistant">

                  <div className="message-avatar">
                    ◈
                  </div>

                  <div className="message-content">

                    <div className="task-status">
                      {getStatusText()}
                    </div>

                    <div className="task-progress">
                      <div className="task-progress-bar" />
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* Input */}
          <div className="input-area">

            <div className="input-wrapper">

              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Give ARIOS a task..."
                rows="1"
                disabled={loading}
              />

              <button
                className="send-button"
                onClick={sendMessage}
                disabled={loading}
              >
                ↑
              </button>

            </div>

            <p className="disclaimer">
              ARIOS can make mistakes. Check important information.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;
