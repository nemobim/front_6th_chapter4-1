import { ProductList, SearchBar } from "../components";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { productStore } from "../stores";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      if (typeof window === "undefined") {
        console.log("이 코드는 서버에서 실행이 되고 ");
        return;
      }

      // SSR에서 발생한 hydration이 있으면 로딩 건너뛰기
      const currentState = productStore.getState();
      if (currentState.products?.length > 0 && currentState.status === "done") {
        console.log("✅ 이미 SSR 데이터가 로드되어 있음");
        return;
      }

      console.log("🔄 CSR로 데이터 로딩 시작");
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  (props = {}) => {
    const productState =
      props.products?.length > 0
        ? {
            products: props.products,
            loading: false,
            error: null,
            totalCount: props.totalCount,
            categories: props.categories,
          }
        : productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = router.query;
    const { products, loading, error, totalCount, categories } = productState;
    const category = { category1, category2 };
    const hasMore = products.length < totalCount;

    return PageWrapper({
      headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: `
        <!-- 검색 및 필터 -->
        ${SearchBar({ searchQuery, limit, sort, category, categories })}
        
        <!-- 상품 목록 -->
        <div class="mb-6">
          ${ProductList({
            products,
            loading,
            error,
            totalCount,
            hasMore,
          })}
        </div>
      `.trim(),
    });
  },
);
