// From: https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-react/src/hooks/use-element-size.ts#L10

import { useLayoutEffect, useMemo, useReducer } from "react";

function computeSize(element: HTMLElement | null) {
  if (element === null) return { width: 0, height: 0 };
  const { width, height } = element.getBoundingClientRect();
  return { width, height };
}

export function useElementSize(
  ref: React.MutableRefObject<HTMLElement | null> | HTMLElement | null,
  unit = false,
) {
  const element = ref === null ? null : "current" in ref ? ref.current : ref;
  const [identity, forceRerender] = useReducer(() => ({}), {});

  // When the element changes during a re-render, we want to make sure we
  // compute the correct size as soon as possible. However, once the element is
  // stable, we also want to watch for changes to the element. The `identity`
  // state can be used to recompute the size.
  const size = useMemo(() => computeSize(element), [element, identity]);

  useLayoutEffect(() => {
    if (!element) return;

    // Trigger a re-render whenever the element resizes
    const observer = new ResizeObserver(forceRerender);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element]);

  if (unit) {
    return {
      width: `${size.width}px`,
      height: `${size.height}px`,
    };
  }

  return size;
}
