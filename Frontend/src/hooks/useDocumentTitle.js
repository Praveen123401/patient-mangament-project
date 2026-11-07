import { useEffect } from "react";
import { HOSPITAL_NAME } from "../utils/constants";

export default function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ${HOSPITAL_NAME}` : HOSPITAL_NAME;
    return () => {
      document.title = prev;
    };
  }, [title]);
}