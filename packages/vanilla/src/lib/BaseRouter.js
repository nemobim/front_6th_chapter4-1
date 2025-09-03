/**
 * 기본 라우터 - 공통 기능을 제공하는 추상 클래스
 */
import { createObserver } from "./createObserver.js";

export class BaseRouter {
  #routes;
  #route;
  #observer = createObserver();
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get routes() {
    return this.#routes;
  }

  get target() {
    return this.#route?.handler;
  }

  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * 라우트 등록 - 개발/프로덕션 환경 모두 지원
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // 여러 패턴을 만들어서 다양한 환경 지원
    const patterns = [];

    // 1. 기본 패턴 (개발 환경)
    patterns.push(new RegExp(`^${regexPath}$`));

    // 2. baseUrl이 있는 경우 (프로덕션 환경)
    if (this.#baseUrl && this.#baseUrl !== "" && this.#baseUrl !== "/") {
      patterns.push(new RegExp(`^${this.#baseUrl.replace(/\//g, "\\/")}${regexPath}$`));
    }

    // 3. 후행 슬래시 변형들
    if (regexPath !== "" && !regexPath.endsWith("\\/")) {
      patterns.push(new RegExp(`^${regexPath}\\/$`));
      if (this.#baseUrl && this.#baseUrl !== "" && this.#baseUrl !== "/") {
        patterns.push(new RegExp(`^${this.#baseUrl.replace(/\//g, "\\/")}${regexPath}\\/$`));
      }
    }

    console.log(
      `🔄 라우트 등록: ${path} -> baseUrl: "${this.#baseUrl}" -> patterns:`,
      patterns.map((p) => p.toString()),
    );

    this.#routes.set(path, {
      patterns,
      paramNames,
      handler,
    });
  }

  findRoute(url) {
    console.log("🔍 findRoute 시작 - url:", url, "baseUrl:", this.#baseUrl);

    try {
      const { pathname } = new URL(url, this.getOrigin());
      console.log("🔍 URL 파싱 성공 - pathname:", pathname);

      for (const [routePath, route] of this.#routes) {
        console.log("🔍 라우트 매칭 시도 - routePath:", routePath);

        for (const pattern of route.patterns) {
          const match = pathname.match(pattern);
          if (match) {
            console.log("✅ 라우트 매칭 성공:", routePath, "with pattern:", pattern.toString());
            const params = {};
            route.paramNames.forEach((name, index) => {
              params[name] = match[index + 1];
            });

            return {
              ...route,
              params,
              path: routePath,
            };
          }
        }
      }
      console.log("❌ 매칭되는 라우트 없음");
      return null;
    } catch (error) {
      console.error("❌ findRoute 오류:", error);
      return null;
    }
  }

  updateRoute(url) {
    this.#route = this.findRoute(url);
    this.#observer.notify();
  }

  // 추상 메서드들 - 하위 클래스에서 구현 필요
  getCurrentUrl() {
    throw new Error("getCurrentUrl must be implemented by subclass");
  }

  getOrigin() {
    throw new Error("getOrigin must be implemented by subclass");
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   */
  static parseQuery(search) {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }

  /**
   * 객체를 쿼리 문자열로 변환
   */
  static stringifyQuery(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }

  static getUrl(newQuery, baseUrl = "", pathname = "", search = "") {
    const currentQuery = BaseRouter.parseQuery(search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = BaseRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  }
}
