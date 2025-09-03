import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// MWS 서버 설정
export const mockServer = setupServer(...handlers);
