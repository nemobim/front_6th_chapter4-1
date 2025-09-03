import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { PRODUCT_ACTIONS, productStore } from "./stores";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

// 서버 데이터 복원 (Hydration)
function restoreServerData() {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;
    console.log("🔄 Hydration 데이터:", data);

    if (data.products && data.categories) {
      // 홈페이지 데이터
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: data.products,
          categories: data.categories,
          totalCount: data.totalCount || 0,
          loading: false,
          error: null,
          status: "done",
        },
      });
    } else if (data.currentProduct) {
      // 상품 상세 페이지 데이터
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: [],
          totalCount: 0,
          categories: {},
          currentProduct: data.currentProduct,
          relatedProducts: data.relatedProducts || [],
          loading: false,
          error: null,
          status: "done",
        },
      });
    }

    // 초기 데이터 제거
    delete window.__INITIAL_DATA__;
    return true; // 데이터가 복원되었음을 알림
  }
  return false;
}

function main() {
  const hasServerData = restoreServerData();
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();

  // SSR 데이터가 있으면 라우터 시작을 지연시켜 CSR 덮어쓰기 방지
  if (hasServerData) {
    console.log("✅ SSR 데이터로 시작");
    // 라우터는 시작하되 초기 렌더링은 건너뛰도록 설정
    router.start();
  } else {
    console.log("🔄 CSR 모드로 시작");
    router.start();
  }
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
