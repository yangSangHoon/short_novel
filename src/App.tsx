import type { ReactNode } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { NovelsProvider } from "./lib/novels";
import { ThemeProvider } from "./lib/theme";
import { Library } from "./routes/Library";
import { Editor } from "./routes/Editor";
import { Reader } from "./routes/Reader";
import "./components/ui.css";

export default function App(): ReactNode {
  return (
    <ThemeProvider>
      <NovelsProvider>
        {/* GitHub Pages 처럼 하위 경로에 올라가도 라우팅이 맞도록 빌드 시 base 를 따라간다 */}
        <Router basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/write/:id" element={<Editor />} />
            <Route path="/read/:id" element={<Reader />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NovelsProvider>
    </ThemeProvider>
  );
}
