import { useEffect } from "react";

export default function useClickOutside(ref, onClickOutside) {
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClickOutside(event);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [ref, onClickOutside]);
}
