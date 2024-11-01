export default function resolveSignup(signupResolve, signupResult) {
  if (signupResolve == "opener") {
    window.opener.postMessage(signupResult);
    return;
  }
  if (signupResolve == "parent") {
    window.parent.postMessage(signupResult);
    return;
  }
  if (signupResolve == "delegate") {
    window.signupDelegate(signupResult);
    return;
  }

  console.log(signupResult);
}
