import { useEffect, useState } from "react";

export default function PromiseBuilder({
  promise,
  builder = (snapshot) => null,
}) {
  const [view, setView] = useState(builder(null));

  useEffect(() => {
    (async () => {
      let result = undefined;
      try {
        result = await promise;
      } catch (e) {
        setView(builder([false, e]));
        return;
      }
      setView(builder([true, result]));
    })();
  }, []);

  return view;
}

