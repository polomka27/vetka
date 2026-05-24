import { useEffect, useRef, type RefObject } from "react";

// Блок вешает обработчик pointerdown и вызывает callback, если клик произошёл вне указанного контейнера.
export function useOutsidePointerDown<TElement extends HTMLElement>(
  containerRef: RefObject<TElement | null>,
  onOutsidePointerDown: () => void,
  enabled = true
) {
  const latestHandlerRef = useRef(onOutsidePointerDown);

  useEffect(() => {
    latestHandlerRef.current = onOutsidePointerDown;
  }, [onOutsidePointerDown]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Блок закрывает dropdown на клик или тап по любой области вне контейнера.
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        latestHandlerRef.current();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [containerRef, enabled]);
}
