import { createContext, useCallback, useContext, useEffect, useRef } from "react";

export type Registration = (key: symbol, dirty: boolean) => void;
const noop: Registration = () => {};
export const UnsavedWorkContext = createContext<Registration>(noop);

/** Returns a synchronous clear for confirmed saves that immediately navigate. */
export function useUnsavedWork(dirty: boolean): () => void {
  const register = useContext(UnsavedWorkContext);
  const key = useRef(Symbol("private-editor"));
  useEffect(() => {
    const editorKey = key.current;
    register(editorKey, dirty);
    return () => register(editorKey, false);
  }, [dirty, register]);
  return useCallback(() => register(key.current, false), [register]);
}
