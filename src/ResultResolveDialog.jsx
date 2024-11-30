import { Typography } from "@mui/material";
import { useEffect, useRef } from "react";

export default function ResolveResultDialog({ payload, onClose }) {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    doResolveCycle();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function doResolveCycle() {
    const resolve = payload.data.searchParamsGet("resolve");
    const resolveStringified =
      payload.data.searchParamsGet("resolveStringified");

    const resolvable = resolveStringified
      ? JSON.stringify({
          data: result,
        })
      : result;

    if (resolve == "opener") {
      window.opener.postMessage(resolvable);
      return;
    }

    if (resolve == "parent") {
      window.parent.postMessage(resolvable);
      return;
    }

    if (resolve == "channel") {
      window.ResolveChannel.postMessage(resolvable);
      return;
    }

    if (resolve == "remote") {
      const key = payload.data.searchParamsGet("resolveRemoteKey");

      try {
        await fetch(`${serverReach}/remoteResolve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: key,
            result: resolvable,
          }),
        });
      } catch (e) {
        setTimeout(() => {
          if (mountedRef.current == true) {
            doResolveCycle();
          }
        }, 2000);
        return;
      }

      return;
    }

    console.log("RESOLVE-RESULT", resolvable);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "10px",
        gap: "12px",
      }}
    >
      <Typography>Awaiting Next Step</Typography>
    </div>
  );
}
