import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// MSW 서버 설정 - Node.js 환경에서 API 요청을 가로채기 위한 설정
// 이 서버는 SSR(Server-Side Rendering) 시 서버에서 발생하는 API 요청을 모킹합니다
export const mockServer = setupServer(...handlers);
