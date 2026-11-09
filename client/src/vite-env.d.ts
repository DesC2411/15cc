/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Địa chỉ server Colyseus, ví dụ ws://localhost:2567. Bỏ trống thì dùng máy đang mở trang. */
  readonly VITE_SERVER_URL?: string
}
