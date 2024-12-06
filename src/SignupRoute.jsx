import { useEffect, useRef, useState } from "react";
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
import ResultResolveDialog from "./ResultResolveDialog";
import { serverReach } from "./main";
import MuiDialogerProvider from "./MuiDialogerProvider";

export default function SignupRoute() {
  return (
    <DialogsProvider>
      <$SignupRoute />
    </DialogsProvider>
  );
}

function $SignupRoute() {
  const navigate = useNavigate();

  const dialogerRef = useRef(undefined);

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

  async function doGotoSignin() {
    const _searchParams = new URLSearchParams();
    _searchParams.set("optSignup", "true");

    if (searchParams.has("resolve")) {
      _searchParams.set("resolve", searchParams.get("resolve"));
    }

    if (searchParams.has("resolveStringified")) {
      _searchParams.set(
        "resolveStringified",
        searchParams.get("resolveStringified")
      );
    }

    if (searchParams.has("remoteResolveKey")) {
      _searchParams.set(
        "remoteResolveKey",
        searchParams.get("remoteResolveKey")
      );
    }

    navigate(`/signin?${_searchParams.toString()}`);
  }

  useEffect(() => {
    doGetDeadboltAutoData();
  }, []);

  return (
    <MuiDialogerProvider dialogerRef={dialogerRef}>
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
                  <Typography align="center">
                    Failed to setup sign-up
                  </Typography>
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

                          return createConfirmForeignCode(key, {
                            codeWhere: suffixedData.codeWhere,
                            codeWhereIdentifier:
                              suffixedData.codeWhereIdentifier,
                            trimInput: suffixedData.trimInput,
                            stepPassToken: suffixedData.stepPassToken,
                          });
                        }

                        if (text.startsWith(`CREATE-PASSWORD:`)) {
                          const suffixedData = JSON.parse(
                            text.substring(`CREATE-PASSWORD:`.length)
                          );

                          return createCreatePassword(key, {
                            stepPassToken: suffixedData.stepPassToken,
                          });
                        }

                        throw text;
                      }

                      if (serverResult.status == 400) {
                        const text = await serverResult.text();

                        if (text.startsWith(`REJECTED:`)) {
                          const suffixedData = JSON.parse(
                            text.substring(`REJECTED:`.length)
                          );

                          throw new Signup.Id.RejectedError({
                            variant: suffixedData.variant,
                            customMessage: suffixedData.customMessage,
                          });
                        }

                        throw text;
                      }

                      throw await serverResult.text();
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
                    searchParams.get("signin") == "true"
                      ? () => {
                          doGotoSignin();
                        }
                      : undefined
                  }
                  onResult={async (result, signupMethod) => {
                    const { user, autoSigninToken } = result;

                    const signin = searchParams.get("signin");

                    if (signin == "true") {
                      if (autoSigninToken == undefined) {
                        await dialogs.alert(
                          "Account created. Sign-in to continue"
                        );

                        doGotoSignin();

                        return;
                      }

                      const confirmDoAutoSignin = await dialogs.confirm(
                        "Account created. Auto sign-in? Cancel to go sign-in manually"
                      );

                      if (!confirmDoAutoSignin) {
                        doGotoSignin();
                        return;
                      }

                      let signupMethodKey = null;
                      for (const key of Object.keys(signupMethods)) {
                        if (signupMethods[key] == signupMethod) {
                          signupMethodKey = key;
                          break;
                        }
                      }

                      let signin = null;

                      while (true) {
                        try {
                          const fetchResult = await LoadingDialog.useDialogs(
                            dialogs,
                            fetch(
                              `${serverReach}/signup/${signupMethodKey}/autoSignin`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  user,
                                  autoSigninToken,
                                }),
                              }
                            ),
                            { message: "Auto Signing-in" }
                          );

                          if (fetchResult.status == 200) {
                            signin = await LoadingDialog.useDialogs(
                              dialogs,
                              fetchResult.text()
                            );

                            break;
                          }
                        } catch (e) {
                          const confirmRetryAutoSignin = await dialogs.confirm(
                            "Auto sign-in failed. Retry? Cancel to go sign-in manually"
                          );

                          if (!confirmRetryAutoSignin) {
                            doGotoSignin();
                            return;
                          }

                          //continuing to retry auto sign-in...
                        }
                      }

                      dialogerRef.current.open(
                        ResultResolveDialog,
                        {
                          result: {
                            user: user,
                            signin: signin,
                          },
                          data: {
                            searchParamsData: Object.fromEntries(
                              searchParams.entries()
                            ),
                          },
                        },
                        {
                          fullScreen: true,
                        }
                      );

                      return;
                    }

                    dialogerRef.current.open(
                      ResultResolveDialog,
                      {
                        result: {
                          user,
                          autoSigninToken,
                        },
                        data: {
                          searchParamsData: Object.fromEntries(
                            searchParams.entries()
                          ),
                        },
                      },
                      {
                        fullScreen: true,
                      }
                    );
                  }}
                />
              );
            }}
          />
        ) : null}
      </div>
    </MuiDialogerProvider>
  );
}

function createConfirmForeignCode(
  signupMethodKey,
  { codeWhere, codeWhereIdentifier, trimInput, stepPassToken }
) {
  return new ConfirmForeignCode({
    codeWhere: codeWhere,
    codeWhereIdentifier: codeWhereIdentifier,
    trimInput: trimInput,
    onSubmit: async (code) => {
      const serverResult = await fetch(
        `${serverReach}/signup/${signupMethodKey}/withConfirmForeignCodeStep`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codeWhere: codeWhere,
            codeWhereIdentifier: codeWhereIdentifier,
            code,
            stepPassToken: stepPassToken,
          }),
        }
      );

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

          return createConfirmForeignCode(signupMethodKey, {
            codeWhere: suffixedData.codeWhere,
            codeWhereIdentifier: suffixedData.codeWhereIdentifier,
            trimInput: suffixedData.trimInput,
            stepPassToken: suffixedData.stepPassToken,
          });
        }

        if (text.startsWith(`CREATE-PASSWORD:`)) {
          const suffixedData = JSON.parse(
            text.substring(`CREATE-PASSWORD:`.length)
          );

          return createCreatePassword(signupMethodKey, {
            stepPassToken: suffixedData.stepPassToken,
          });
        }

        throw text;
      }

      if (serverResult.status == 400) {
        const text = await serverResult.text();

        if (text.startsWith(`REJECTED:`)) {
          const suffixedData = JSON.parse(text.substring(`REJECTED:`.length));

          throw new ConfirmForeignCode.RejectedError({
            variant: suffixedData.variant,
            customMessage: suffixedData.customMessage,
          });
        }

        throw text;
      }

      throw await serverResult.text();
    },
  });
}

function createCreatePassword(signupMethodKey, { stepPassToken }) {
  return new CreatePassword({
    onSubmit: async (password) => {
      const serverResult = await fetch(
        `${serverReach}/signup/${signupMethodKey}/withCreatePasswordStep`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: password,
            stepPassToken: stepPassToken,
          }),
        }
      );

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

          return createConfirmForeignCode(signupMethodKey, {
            codeWhere: suffixedData.codeWhere,
            codeWhereIdentifier: suffixedData.codeWhereIdentifier,
            trimInput: suffixedData.trimInput,
            stepPassToken: suffixedData.stepPassToken,
          });
        }

        if (text.startsWith(`CREATE-PASSWORD:`)) {
          const suffixedData = JSON.parse(
            text.substring(`CREATE-PASSWORD:`.length)
          );

          return createCreatePassword(signupMethodKey, {
            stepPassToken: suffixedData.stepPassToken,
          });
        }

        throw text;
      }

      if (serverResult.status == 400) {
        const text = await serverResult.text();

        if (text.startsWith(`REJECTED:`)) {
          const suffixedData = JSON.parse(text.substring(`REJECTED:`.length));

          throw new CreatePassword.RejectedError({
            variant: suffixedData.variant,
            customMessage: suffixedData.customMessage,
          });
        }

        throw text;
      }

      throw await serverResult.text();
    },
  });
}
