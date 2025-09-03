import express from "express";
import fs from "node:fs/promises";
import { mockServer } from "./src/mocks/mockServer.js";

// 환경 변수 및 상수 설정
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174; // SSR 포트
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

// Express 앱 생성
const app = express();

mockServer.listen({
  onUnhandledRequest: "bypass",
});

// HTML 템플릿
let template;
// SSR 함수: 컴포넌트를 HTML로 변환
let render;
// 개발 서버 인스턴스
let vite;

// 환경별 설정
if (!isProduction) {
  // 개발 환경: Vite 개발 서버 연동
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  // 빌드된 파일들을 gzip 압축으로 전송 (성능 최적화)
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));

  // 빌드된 템플릿과 렌더 함수 로드
  template = await fs.readFile("./dist/vanilla/index.html", "utf-8");
  render = (await import("./dist/vanilla-ssr/main-server.js")).render;
}

// SSR 렌더링 미들웨어
app.get(/^(?!.*\/api).*$/, async (req, res) => {
  try {
    // URL에서 베이스 경로 제거 (정규화)
    const url = req.originalUrl.replace(base, "");

    if (!isProduction) {
      // 개발 환경: 매 요청마다 최신 템플릿과 렌더 함수 로드
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    }

    //React 컴포넌트를 HTML로 변환
    const rendered = await render(url, req.query);

    //window.__INITIAL_DATA__로 클라이언트에 초기 데이터 전달 (Hydration용)

    // 템플릿의 플레이스홀더를 실제 컨텐츠로 교체
    const html = template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${rendered.initialData}</script>`)
      .replace("<!--app-html-->", rendered.html ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    // 개발 환경에서 스택 트레이스 정리
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error);
    }

    console.error("❌ SSR 에러:", error.stack);
    res.status(500).end(error.stack);
  }
});

// HTTP 서버 시작
app.listen(port, () => {
  console.log(`🌐 SSR 서버가 http://localhost:${port} 에서 실행 중입니다`);
});
