/** result must be a jsonable value ie. string, number, json-array, json-object */
export default function resolveResult(resolve, resolveStringified, result) {
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

  console.log("RESOLVE-RESULT", resolvable);
}
