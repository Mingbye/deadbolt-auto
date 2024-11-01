import { useEffect, useState } from "react";
import PromiseBuilder from "./PromiseBuilder";
import {
  ConfirmForeignCode,
  CreatePassword,
  Signin,
  Signup,
  SolveAntiRobotChallenge,
} from "@mingbye/deadbolt-react";
import { CircularProgress, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DialogsProvider, useDialogs } from "@toolpad/core";
import LoadingDialog from "./LoadingDialog";
import resolveSignin from "./resolveSignin";
import resolveSignup from "./resolveSignup";

const serverReach = `http://localhost/app/deadbolt`;

export default function SignupRoute() {
  return (
    <DialogsProvider>
      <$SignupRoute />
    </DialogsProvider>
  );
}

function $SignupRoute() {
  const navigate = useNavigate();

  const dialogs = useDialogs();

  const [gettingDeadboltAutoData, setGettingDeadboltAutoData] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  async function doGetDeadboltAutoData() {
    setGettingDeadboltAutoData(
      (async function () {
        const result = await fetch(`${serverReach}/signup`, {
          method: "POST",
        });

        if (result.status == 200) {
          return await result.json();
        }

        throw await result.text();
      })()
    );
  }

  async function doAutoSignin(signupMethodKey, user, autoSigninToken) {
    async function doPromptRetryAndRetry() {
      const retry = await dialogs.confirm(`Auto sign-in failed. Try again?`);

      if (retry) {
        return await doAutoSignin(signupMethodKey, user, autoSigninToken);
      }

      return {
        user: user,
        signin: null,
      };
    }

    let fetchResult = null;

    try {
      fetchResult = await LoadingDialog.useDialogs(
        dialogs,
        fetch(`${serverReach}/signup/${signupMethodKey}/autoSignin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user,
            autoSigninToken,
          }),
        }),
        { message: "Auto Signing-in"  }
      );
    } catch (e) {
      return await doPromptRetryAndRetry();
    }

    if (fetchResult.status != 200) {
      return await doPromptRetryAndRetry();
    }

    let signin = null;

    try {
      signin = await LoadingDialog.useDialogs(dialogs, fetchResult.text());
    } catch (e) {
      return await doPromptRetryAndRetry();
    }

    return {
      user: user,
      signin: signin,
    };
  }

  useEffect(() => {
    doGetDeadboltAutoData();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {gettingDeadboltAutoData != null ? (
        <PromiseBuilder
          promise={gettingDeadboltAutoData}
          builder={(snapshot) => {
            if (snapshot == null) {
              return <CircularProgress />;
            }

            if (snapshot[0] != true) {
              //If not a network problem, This is mostly likely because the developer didnot setup the signup module
              return (
                <Typography align="center">Failed to setup sign-up</Typography>
              );
            }

            const deadboltAutoData = snapshot[1];

            const signupMethods = {};
            for (const key of Object.keys(deadboltAutoData.methods)) {
              const item = deadboltAutoData.methods[key];

              let signupMethod = null;

              if (item.type == "Id") {
                signupMethod = new Signup.Id({
                  variant: item.data.variant,
                  trimInput: item.data.trimInput,
                  usePassword: item.data.withPassword,
                  onSubmitId: async (id, password) => {
                    ////////////
                    async function result(serverResult) {
                      if (serverResult.status == 200) {
                        const obj = await serverResult.json();

                        return new Signup.Success({
                          user: obj.user,
                          autoSigninToken: obj.autoSigninToken,
                        });
                      }

                      if (serverResult.status == 428) {
                        const text = await serverResult.text();

                        if (text.startsWith(`CONFIRM-FOREIGN-CODE:`)) {
                          const suffixedData = JSON.parse(
                            text.substring(`CONFIRM-FOREIGN-CODE:`.length)
                          );

                          return new ConfirmForeignCode({
                            codeWhere: suffixedData.codeWhere,
                            codeWhereIdentifier:
                              suffixedData.codeWhereIdentifier,
                            trimInput: suffixedData.trimInput,
                            onSubmit: async (code) => {
                              const serverResult = await fetch(
                                `${serverReach}/signup/${key}/withConfirmForeignCodeStep`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    codeWhere: suffixedData.codeWhere,
                                    codeWhereIdentifier:
                                      suffixedData.codeWhereIdentifier,
                                    code,
                                    stepPassToken: suffixedData.stepPassToken,
                                  }),
                                }
                              );

                              return await result(serverResult);
                            },
                          });
                        }

                        if (text.startsWith(`CREATE-PASSWORD:`)) {
                          const suffixedData = JSON.parse(
                            text.substring(`CREATE-PASSWORD:`.length)
                          );

                          return new CreatePassword({
                            onSubmit: async (password) => {
                              const serverResult = await fetch(
                                `${serverReach}/signup/${key}/withCreatePasswordStep`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    password: password,
                                    stepPassToken: suffixedData.stepPassToken,
                                  }),
                                }
                              );

                              return await result(serverResult);
                            },
                          });
                        }
                      }

                      throw await serverResult.text();
                    }

                    const serverResult = await fetch(
                      `${serverReach}/signup/${key}`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          id,
                          password,
                        }),
                      }
                    );

                    return await result(serverResult);
                  },
                });
              }

              if (signupMethod != null) {
                signupMethods[key] = signupMethod;
              }
            }

            return (
              <Signup
                signupMethod={
                  Object.values(signupMethods).length == 1
                    ? Object.values(signupMethods)[0]
                    : Object.values(signupMethods)
                }
                provideOptSignin={
                  searchParams.get("optSignin") == "true"
                    ? async () => {
                        const _searchParams = new URLSearchParams();
                        _searchParams.set("allowSignup", "true");

                        navigate(`/signin?${_searchParams.toString()}`);
                      }
                    : undefined
                }
                onResult={async (result, signupMethod) => {
                  const signin = searchParams.get("signin");

                  if (signin == "true") {
                    const signinResolve = searchParams.get("signinResolve");

                    const { user, autoSigninToken } = result;

                    if (autoSigninToken == undefined) {
                      resolveSignin(signinResolve, {
                        user,
                        signin: null,
                      });

                      return;
                    }

                    const confirmDoAutoSignin = await dialogs.confirm(
                      "Account created. Auto sign-in?"
                    );

                    if (!confirmDoAutoSignin) {
                      resolveSignin(signinResolve, {
                        user,
                        signin: null,
                      });

                      return;
                    }

                    let signupMethodKey = null;
                    for (const key of Object.keys(signupMethods)) {
                      if (signupMethods[key] == signupMethod) {
                        signupMethodKey = key;
                        break;
                      }
                    }

                    const doAutoSigninResult = await doAutoSignin(
                      signupMethodKey,
                      user,
                      autoSigninToken
                    );

                    resolveSignin(signinResolve, {
                      user: doAutoSigninResult.user,
                      signin: doAutoSigninResult.signin,
                    });

                    return;
                  }

                  const resolve = searchParams.get("resolve");

                  resolveSignup(resolve, result);
                }}
              />
            );
          }}
        />
      ) : null}
    </div>
  );
}
