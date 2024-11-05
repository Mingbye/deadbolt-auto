export default function resolveResult(resolve, result) {
  if (resolve == "opener") {
    window.opener.postMessage(result);
    return;
  }

  if (resolve == "parent") {
    window.parent.postMessage(result);
    return;
  }

  console.log("RESOLVE-RESULT", result);
}
