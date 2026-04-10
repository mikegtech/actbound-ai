import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

const useHashScrollIntoView = (
  scrollOptions: ScrollIntoViewOptions = {
    block: "center",
    behavior: "smooth",
  },
  delay: number = 100,
) => {
  const { hash } = useLocation();

  useEffect(() => {
    setTimeout(() => {
      if (hash) {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);

        if (element) {
          element.scrollIntoView(scrollOptions);
        }
      }
    }, delay);
  }, [scrollOptions, hash.replace, hash, delay]);
};

export default useHashScrollIntoView;
