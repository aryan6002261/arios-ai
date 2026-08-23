import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
      const response = await fetch("/api/chat", {
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

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content: data.response,
      };

      setMessages((current) => [...current, assistantMessage]);
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
    } finally {
      setLoading(false);
    }
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
              Current conversation
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
          {messages.length === 0 && (
            <div className="welcome">

              <div className="ai-icon">
                ◈
              </div>

              <h1>How can I help you?</h1>

              <p>
                I'm ARIOS, your intelligent AI assistant.
                Ask me anything.
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

              {loading && (
                <div className="message-row assistant">

                  <div className="message-avatar">
                    ◈
                  </div>

                  <div className="message-content">
                    ARIOS is thinking...
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
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ARIOS..."
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
