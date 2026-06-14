import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Self-hosted fonts (bundled same-origin — no render-blocking external request).
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/400-italic.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/dm-serif-display/400.css";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
