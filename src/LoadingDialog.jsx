import { Button, CircularProgress, Dialog, Typography } from "@mui/material";
import { useEffect } from "react";

export default function LoadingDialog({ payload, open, onClose }) {
  useEffect(() => {
    (async function () {
      let result = null;
      try {
        result = await payload.promise;
      } catch (e) {
        onClose([false, e]);
        return;
      }
      onClose([true, result]);
    })();
  }, []);

  return (
    <Dialog
      open={open}
      sx={{
        boxSizing: "border-box",
      }}
    >
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
        <CircularProgress
          style={{
            marginTop: "5px",
          }}
        />
        {payload.message != undefined ? (
          <Typography
            style={{
              fontSize: "15px",
              // fontWeight: "bold",
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {payload.message}
          </Typography>
        ) : null}
        {payload.cancellable ? (
          <Button
            variant="outlined"
            onClick={() => {
              onClose([false, new LoadingDialog.Cancelled()]);
            }}
          >
            cancel
          </Button>
        ) : null}
      </div>
    </Dialog>
  );
}

LoadingDialog.Cancelled = class {};

LoadingDialog.useDialogs = async (
  dialogs,
  promise,
  { message, cancellable } = {}
) => {
  const [ok, data] = await dialogs.open(LoadingDialog, {
    promise,
    message,
    cancellable,
  });

  if (!ok) {
    throw data;
  }

  return data;
};
