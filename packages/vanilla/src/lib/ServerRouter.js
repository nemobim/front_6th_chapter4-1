/**
 * 서버사이드 라우터
 */
import { BaseRouter } from "./BaseRouter.js";

export class ServerRouter extends BaseRouter {
  #currentUrl = "/";
  #origin = "http://localhost";
  #queryParams = {}; // 서버에서 전달받은 쿼리 파라미터 저장

  constructor(baseUrl = "") {
    super(baseUrl);
  }

  get query() {
    // 서버에서 설정된 쿼리 파라미터 사용
    return this.#queryParams;
  }

  set query(newQuery) {
    this.#queryParams = { ...newQuery };
  }

  getCurrentUrl() {
    return this.#currentUrl;
  }

  getOrigin() {
    return this.#origin;
  }

  /**
   * 서버 URL 설정
   * @param {string} url - 요청 URL
   * @param {string} [origin] - 서버 origin (선택적)
   */
  setUrl(url, origin = "http://localhost") {
    this.#currentUrl = url;
    this.#origin = origin;
    this.updateRoute(this.getCurrentUrl());
  }

  /**
   * 서버사이드에서는 네비게이션 불가
   */
  push() {
    throw new Error("Navigation is not supported in server-side routing");
  }

  /**
   * 라우터 시작
   */
  start() {
    this.updateRoute(this.getCurrentUrl());
  }
}
