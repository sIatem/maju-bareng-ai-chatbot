import { render } from "preact";
import ChatComponent from "./components/chat";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

render(<ChatComponent />, root);
