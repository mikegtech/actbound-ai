import { loadIcons } from "@iconify/react/dist/iconify.js";
import { icons } from "lib/iconifyIcons";
import { useEffect } from "react";

const loadPreIcons = (icons: string[]) => {
  return new Promise((fulfill, reject) => {
    loadIcons(icons, (loaded, missing, pending) => {
      if (pending.length) {
        return;
      }
      if (missing.length) {
        reject({
          loaded,
          missing,
        });
      } else {
        fulfill({
          loaded,
        });
      }
    });
  });
};

const useIcons = () => {
  useEffect(() => {
    const preloadIcons = async () => {
      try {
        await loadPreIcons(icons);
      } catch (err) {
        const iconError = err as { missing?: string[] };
        console.error("Error loading icons:", iconError.missing);
      }
    };

    preloadIcons();
  }, []);
};

export default useIcons;
