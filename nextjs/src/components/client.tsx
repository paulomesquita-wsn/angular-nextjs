"use client";

import { useEffect, useState } from "react";

const key = "token";

export const CComponent = () => {
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? window.localStorage.getItem(key) : null
  );

  useEffect(() => {
    if (token) localStorage.setItem(key, token);
  }, [token]);

  return (
    <>
      <div>This is a client component</div>
      <div>Current token: {token}</div>
      <button onClick={() => setToken(crypto.randomUUID())}>
        Set another token
      </button>
    </>
  );
};
