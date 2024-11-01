export default function resolveSignin(signinResolve, signinResult) {
  if (signinResolve == "opener") {
    window.opener.postMessage(signinResult);
    return;
  }
  if (signinResolve == "parent") {
    window.parent.postMessage(signinResult);
    return;
  }
  if (signinResolve == "delegate") {
    window.signinDelegate(signinResult);
    return;
  }

  console.log(signinResult);
}
