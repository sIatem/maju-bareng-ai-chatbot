import { Component, render, h } from "preact";

export default class ChatComponent extends Component {
  state = { conversations: [], text: "" };

  componentDidMount() {
    const savedConversations = localStorage.getItem("conversations");
    if (savedConversations) {
      this.setState({ conversations: JSON.parse(savedConversations) });
    }
  }

  updateConversations = (newConversations) => {
    this.setState({ conversations: newConversations });
    localStorage.setItem("conversations", JSON.stringify(newConversations));
  };

  setText = (e) => {
    this.setState({ text: e.currentTarget.value });
  };

  handleSubmit = () => {
    const { conversations, text } = this.state;
    if (text === "") return;

    const newConversations = [...conversations, { role: "user", text }];
    this.updateConversations(newConversations);
    this.setState({ text: "" });

    this.sendMessage(newConversations);
  };

  sendMessage = async (currentConversations) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: currentConversations,
        }),
      });
      const result = await response.json();
      const newConversations = [
        ...currentConversations,
        { role: "model", text: result.data },
      ];
      this.updateConversations(newConversations);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  render({}, { conversations, text }) {
    return (
      <div class="container flex v-center flex-direction-column">
        <div class="top-bar">
          <h1 class="heading">Gemini AI Chatbot</h1>
        </div>

        <div class="chatbox">
          <div class="messages">
            {conversations.map((message) =>
              message.role === "user" ? (
                <div class="message outgoing bubble">{message.text}</div>
              ) : (
                <div class="message incoming bubble">{message.text}</div>
              ),
            )}
          </div>
          <form
            onSubmit={this.handleSubmit}
            action="javascript:"
            class="bottom-bar"
          >
            <input
              id="messageText"
              name="message"
              autocomplete="off"
              type="text"
              value={text}
              onInput={this.setText}
              placeholder="Type a message..."
            />
            <button type="submit" disabled={this.state.text === ""}>
              Send
            </button>
          </form>
        </div>
      </div>
    );
  }
}
