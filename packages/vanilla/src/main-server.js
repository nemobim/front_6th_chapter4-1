import { getCategories, getProduct, getProducts } from "./api/productApi";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { PRODUCT_ACTIONS, productStore } from "./stores";

// 라우터 등록
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

// 스토어 디스패치 헬퍼 함수
const updateStore = (payload) => {
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload,
  });
};

// 기본 스토어 상태 생성 함수
const createBaseStoreState = () => ({
  products: [],
  totalCount: 0,
  categories: {},
  currentProduct: null,
  relatedProducts: [],
  loading: false,
  error: null,
  status: "done",
});

/**
 * 서버 렌더링 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 요청 쿼리
 * @returns {Promise<Object>} - 렌더링 결과
 */
export const render = async (url, query) => {
  try {
    // ServerRouter에 맞게 URL 설정
    router.setUrl(url, "http://localhost");
    router.query = query;
    router.start();

    const route = router.route;
    if (!route) {
      console.log("❌ 라우트를 찾을 수 없음 - URL:", url);
      for (const [path] of router.routes) {
        console.log("  -", path);
      }
      return {
        head: "<title>페이지를 찾을 수 없습니다</title>",
        html: NotFoundPage(),
        initialData: JSON.stringify({}),
      };
    }

    let head;
    let initialData;

    // 홈페이지 처리 - route.path 대신 route.path 사용
    if (route.path === "/") {
      console.log("✅ 홈페이지 라우트 매칭됨");
      console.log("🔍 쿼리 파라미터:", router.query);
      try {
        const [productsResponse, categories] = await Promise.all([getProducts(router.query), getCategories()]);

        const storeState = {
          ...createBaseStoreState(),
          products: productsResponse.products || [],
          totalCount: productsResponse.pagination?.total || 0,
          categories: categories || {},
        };

        updateStore(storeState);

        head = "<title>쇼핑몰 - 홈</title>";
        initialData = JSON.stringify({
          products: storeState.products,
          categories: storeState.categories,
          totalCount: storeState.totalCount,
        });
      } catch (error) {
        console.error("❌ 홈페이지 데이터 로딩 실패:", error);
        const errorState = {
          ...createBaseStoreState(),
          error: error.message,
          status: "error",
        };

        updateStore(errorState);

        initialData = JSON.stringify({
          products: [],
          categories: {},
          totalCount: 0,
        });
      }
    }
    // 상품 상세 페이지 처리
    else if (route.path === "/product/:id/") {
      console.log("✅ 상품상세 라우트 매칭됨");
      const productId = route.params.id;

      try {
        const product = await getProduct(productId);

        let relatedProducts = [];
        if (product?.category2) {
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: 20,
            page: 1,
          });
          relatedProducts = relatedResponse.products?.filter((p) => p.productId !== productId) || [];
        }

        const storeState = {
          ...createBaseStoreState(),
          currentProduct: product,
          relatedProducts,
        };

        updateStore(storeState);

        head = `<title>${product.title} - 쇼핑몰</title>`;
        initialData = JSON.stringify({
          currentProduct: product,
          relatedProducts,
        });
      } catch (error) {
        console.error("❌ 상품상세 데이터 로딩 실패:", error);
        const errorState = {
          ...createBaseStoreState(),
          error: error.message,
          status: "error",
        };

        updateStore(errorState);

        initialData = JSON.stringify({
          currentProduct: null,
          relatedProducts: [],
        });
      }
    }

    const PageComponent = router.target;
    const html = PageComponent();

    return {
      html,
      head,
      initialData,
    };
  } catch (error) {
    console.error("❌ SSR 에러:", error);

    return {
      head: "<title>에러</title>",
      html: "<div>서버 오류가 발생했습니다.</div>",
      initialData: JSON.stringify({ error: error.message }),
    };
  }
};
