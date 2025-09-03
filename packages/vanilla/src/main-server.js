// ===== 간단한 라우터 =====
const routes = [];

function addRoute(path, handler) {
  console.log(`📍 라우트 등록: ${path}`);

  // :id를 정규식으로 변환
  const paramNames = [];
  const regexPattern = path.replace(/:(\w+)/g, (match, paramName) => {
    paramNames.push(paramName);
    return "([^/]+)";
  });

  const regexp = new RegExp(`^${regexPattern}$`);

  routes.push({
    originalPath: path,
    regexp,
    paramNames,
    handler,
  });
}

function findRoute(url) {
  console.log(`🔍 라우트 찾기: ${url}`);

  for (const route of routes) {
    const match = route.regexp.exec(url);

    if (match) {
      console.log(`  ✅ 매칭: ${route.originalPath}`);

      // 파라미터 추출
      const params = {};
      route.paramNames.forEach((paramName, index) => {
        params[paramName] = match[index + 1];
      });

      return { handler: route.handler, params };
    }
  }

  return null;
}

// ===== 데이터 프리페칭 (mockApi 사용) =====
async function prefetchHomeData() {
  console.log("🔄 홈페이지 데이터 로딩...");

  // TODO: 실제로는 이런 API 사용
  // const products = await mockGetProducts({ limit: 20 });
  // const categories = await mockGetCategories();

  const mockData = {
    products: [
      { id: 1, name: "맥북 프로", price: 2000000, category: "전자기기", image: "/images/macbook.jpg" },
      { id: 2, name: "아이폰", price: 1200000, category: "전자기기", image: "/images/iphone.jpg" },
      { id: 3, name: "운동화", price: 150000, category: "의류", image: "/images/shoes.jpg" },
    ],
    categories: [
      { id: 1, name: "전자기기" },
      { id: 2, name: "의류" },
    ],
  };

  // productStore.dispatch(SETUP, mockData); // TODO: 스토어 연동

  return mockData;
}

async function prefetchProductData(productId) {
  console.log(`🔄 상품 ${productId} 데이터 로딩...`);

  // TODO: const product = await mockGetProduct(productId);

  const mockProduct = {
    id: productId,
    name: `상품 ${productId}`,
    price: 50000 + parseInt(productId) * 10000,
    description: `상품 ${productId}의 상세 설명입니다.`,
    category: "전자기기",
    stock: 10,
    rating: 4.5,
    image: `/images/product${productId}.jpg`,
  };

  // productStore.dispatch(SET_CURRENT_PRODUCT, mockProduct); // TODO: 스토어 연동

  return { product: mockProduct };
}

// ===== HTML 렌더링 함수들 =====
async function renderHomePage() {
  console.log("🎨 홈페이지 렌더링...");

  const data = await prefetchHomeData();

  const head = `
    <title>쇼핑몰 - 홈페이지</title>
    <meta name="description" content="최고의 상품들을 만나보세요">
  `;

  // 간단한 HTML (나중에 컴포넌트로 교체 예정)
  const html = `
    <div class="container mx-auto p-4">
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-blue-600">🛍️ 쇼핑몰</h1>
        <p class="text-gray-600 mt-2">서버사이드 렌더링</p>
      </header>
      
      <section>
        <h2 class="text-2xl font-semibold mb-4">상품 목록 (${data.products.length}개)</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${data.products
            .map(
              (product) => `
            <div class="bg-white rounded-lg shadow-md p-6">
              <h3 class="text-lg font-semibold mb-2">${product.name}</h3>
              <p class="text-gray-600 mb-2">${product.category}</p>
              <p class="text-xl font-bold text-blue-600 mb-4">${product.price.toLocaleString()}원</p>
              <a href="/product/${product.id}" class="bg-blue-500 text-white px-4 py-2 rounded">
                상세보기
              </a>
            </div>
          `,
            )
            .join("")}
        </div>
      </section>
    </div>
  `;

  return {
    head,
    html,
    initialData: {
      page: "home",
      products: data.products,
      categories: data.categories,
    },
  };
}

async function renderProductDetailPage(params) {
  console.log(`🎨 상품 상세 렌더링... ID: ${params.id}`);

  const data = await prefetchProductData(params.id);
  const { product } = data;

  const head = `
    <title>${product.name} - 상품 상세</title>
    <meta name="description" content="${product.description}">
  `;

  const html = `
    <div class="container mx-auto p-4">
      <nav class="mb-4">
        <a href="/" class="text-blue-500">← 홈으로</a>
      </nav>
      
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-4">${product.name}</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
            <span class="text-gray-500">📷 상품 이미지</span>
          </div>
          
          <div>
            <div class="text-3xl font-bold text-blue-600 mb-4">
              ${product.price.toLocaleString()}원
            </div>
            <p class="text-gray-700 mb-6">${product.description}</p>
            <p class="text-sm text-gray-600 mb-6">재고: ${product.stock}개</p>
            
            <button class="bg-blue-500 text-white px-6 py-3 rounded-lg">
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    head,
    html,
    initialData: {
      page: "product-detail",
      currentProduct: product,
    },
  };
}

async function render404Page() {
  return {
    head: "<title>404 - 페이지 없음</title>",
    html: `
      <div class="container mx-auto p-4 text-center">
        <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 class="text-2xl mb-4">페이지를 찾을 수 없습니다</h2>
        <a href="/" class="bg-blue-500 text-white px-6 py-3 rounded-lg">홈으로 돌아가기</a>
      </div>
    `,
    initialData: { page: "404" },
  };
}

// ===== 라우트 등록 =====
addRoute("/", renderHomePage);
addRoute("/product/:id", renderProductDetailPage);

// ===== 메인 렌더 함수 =====
export const render = async (url) => {
  console.log(`\n🎯 SSR 시작: ${url}`);

  try {
    const cleanUrl = url.split("?")[0].replace(/\/$/, "") || "/";
    const routeInfo = findRoute(cleanUrl);

    if (!routeInfo) {
      return await render404Page();
    }

    const result = await routeInfo.handler(routeInfo.params);
    console.log("✅ SSR 완료");

    return result;
  } catch (error) {
    console.error("❌ SSR 에러:", error);
    return {
      head: "<title>에러</title>",
      html: "<div>서버 오류가 발생했습니다.</div>",
      initialData: { error: error.message },
    };
  }
};
