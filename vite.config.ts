import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * GitHub Pages 는 프로젝트 사이트를 `/<저장소 이름>/` 아래에 올린다.
 * Actions 안에서는 GITHUB_REPOSITORY 로 이름을 알 수 있으므로 거기서 끌어온다.
 * 로컬에서 빌드하면 값이 없어 루트(`/`)가 되므로 dist 를 그대로 열어도 된다.
 */
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];

// https://vite.dev/config/
export default defineConfig({
  base: repo ? `/${repo}/` : "/",
  plugins: [react()],
});
