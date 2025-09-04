import fs from "fs/promises";
import items from "./src/mocks/items.json" with { type: "json" };
import { mockServer } from "./src/mocks/mockServer.js";

// SSR 번들에서 render 불러오기 (먼저 build:server 필요)
const { render } = await import("./dist/vanilla-ssr/main-server.js");

const BASE = "/front_6th_chapter4-1/vanilla/";

// 단일 라우트를 렌더링하고 파일로 저장
async function writeRoute(url, template, outFile) {
  const { html, head, data } = await render(url, {});
  const result = template
    .replace(`<!--app-head-->`, head ?? "")
    .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${data}</script>`)
    .replace(`<!--app-html-->`, html ?? "");

  // 디렉토리가 없으면 생성
  const outDir = outFile.substring(0, outFile.lastIndexOf("/"));
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, result, "utf-8");
}

async function generateStaticSite() {
  const templatePath = "../../dist/vanilla/index.html";
  const template = await fs.readFile(templatePath, "utf-8");

  mockServer.listen({ onUnhandledRequest: "bypass" });

  try {
    // 홈 페이지 생성
    await writeRoute(BASE, template, templatePath);

    // 상품 ID 목록 생성 (100-129 + 테스트 상품)
    const productIds = items.slice(100, 130).map((p) => p.productId);
    const testProductId = "86940857379";

    // 중복 방지하고 테스트 상품 추가
    if (!productIds.includes(testProductId)) {
      productIds.push(testProductId);
    }

    // 상품 상세 페이지들을 병렬로 생성
    const productTasks = productIds.map((id) => {
      const url = `${BASE}product/${id}/`;
      const outFile = `../../dist/vanilla/product/${id}/index.html`;
      return writeRoute(url, template, outFile);
    });

    await Promise.all(productTasks);

    console.log("✅ SSG 완료: 홈 + 상품 상세 86940857379, 85067212996 포함 31개 생성");
  } finally {
    mockServer.close();
  }
}

await generateStaticSite();
