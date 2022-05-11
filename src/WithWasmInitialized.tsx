import React, { useEffect, useState } from 'react';
import initWasm from '@firfi/rust-wasm-chip8';

export const WithWasmInitialized = ({children}: {children: React.ReactComponentElement<any>}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    initWasm().then(() => setIsInitialized(true)).catch(e => console.error("Error initializing wasm", e));
  }, []);
  if (!isInitialized) return <div>Loading WASM bundle...</div>;
  return children;
}