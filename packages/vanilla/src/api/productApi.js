// 서버/클라이언트 환경에 따른 API base URL 설정
const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    // 서버 환경
    return "http://localhost:5174";
  } else {
    // 클라이언트 환경
    return "";
  }
};

export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/products?${searchParams}`;
  console.log("🌐 API 호출:", url);

  const response = await fetch(url);

  return await response.json();
}

export async function getProduct(productId) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/products/${productId}`;
  console.log("🌐 API 호출:", url);

  const response = await fetch(url);
  return await response.json();
}

export async function getCategories() {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/categories`;
  console.log("🌐 API 호출:", url);

  const response = await fetch(url);
  return await response.json();
}
