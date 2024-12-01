import { useEffect, useRef, useState } from "react";
import PromiseBuilder from "./PromiseBuilder";
import {
  ConfirmForeignCode,
  CreatePassword,
  Signin,
  SolveAntiRobotChallenge,
} from "@mingbye/deadbolt-react";
import { CircularProgress, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import ResultResolveDialog from "./ResultResolveDialog";
import { serverReach } from "./main";
import MuiDialogerProvider from "./MuiDialogerProvider";

export default function SigninRoute() {
  const navigate = useNavigate();

  const dialogerRef = useRef(undefined);

  const [gettingDeadboltAutoData, setGettingDeadboltAutoData] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  async function doGetDeadboltAutoData() {
    setGettingDeadboltAutoData(
      (async function () {
        const result = await fetch(`${serverReach}/signin`, {
          method: "POST",
        });

        if (result.status == 200) {
          return await result.json();
        }

        throw await result.text();
      })()
    );
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
                //If not a network problem, This is mostly likely because the developer didnot setup the signin module
                return (
                  <Typography align="center">
                    Failed to setup sign-in
                  </Typography>
                );
              }

              const deadboltAutoData = snapshot[1];

              const signinMethods = [];
              for (const key of Object.keys(deadboltAutoData.methods)) {
                const item = deadboltAutoData.methods[key];

                let signinMethod = null;

                if (item.type == "Id") {
                  signinMethod = new Signin.Id({
                    variant: item.data.variant,
                    trimInput: item.data.trimInput,
                    usePassword: item.data.withPassword,
                    onSubmitId: async (id, password) => {
                      const serverResult = await fetch(
                        `${serverReach}/signin/${key}`,
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

                        return new Signin.Success({
                          user: obj.user,
                          signin: obj.signin,
                        });
                      }

                      if (serverResult.status == 428) {
                        const text = await serverResult.text();

                        // if (text.startsWith(`SOLVE-ANTI-ROBOT-CHALLENGE:`)) {
                        //   const suffixedData = JSON.parse(
                        //     text.substring(`SOLVE-ANTI-ROBOT-CHALLENGE:`.length)
                        //   );

                        //   return createSolveAntiRobotChallenge(); ...

                        // }

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

                          throw new Signin.Id.RejectedError({
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

                if (signinMethod != null) {
                  signinMethods.push(signinMethod);
                }
              }

              return (
                <Signin
                  signinMethod={
                    signinMethods.length == 1 ? signinMethods[0] : signinMethods
                  }
                  provideOptSignup={
                    searchParams.get("optSignup") == "true"
                      ? async () => {
                          const _searchParams = new URLSearchParams();

                          _searchParams.set("signin", "true");

                          if (searchParams.has("resolve")) {
                            _searchParams.set(
                              "resolve",
                              searchParams.get("resolve")
                            );
                          }

                          if (searchParams.has("resolveStringified")) {
                            _searchParams.set(
                              "resolveStringified",
                              searchParams.get("resolveStringified")
                            );
                          }

                          navigate(`/signup?${_searchParams.toString()}`);
                        }
                      : undefined
                  }
                  onResult={(result) => {
                    const _searchParams = new URLSearchParams(searchParams);

                    dialogerRef.current.open(
                      ResultResolveDialog,
                      {
                        result: result,
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
  signinMethodKey,
  { codeWhere, codeWhereIdentifier, trimInput, stepPassToken }
) {
  return new ConfirmForeignCode({
    codeWhere: codeWhere,
    codeWhereIdentifier: codeWhereIdentifier,
    trimInput: trimInput,
    onSubmit: async (code) => {
      const serverResult = await fetch(
        `${serverReach}/signin/${signinMethodKey}/withConfirmForeignCodeStep`,
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

        return new Signin.Success({
          user: obj.user,
          signin: obj.signin,
        });
      }

      if (serverResult.status == 428) {
        const text = await serverResult.text();

        if (text.startsWith(`CONFIRM-FOREIGN-CODE:`)) {
          const suffixedData = JSON.parse(
            text.substring(`CONFIRM-FOREIGN-CODE:`.length)
          );

          return createConfirmForeignCode(signinMethodKey, {
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

          return createCreatePassword(signinMethodKey, {
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

function createCreatePassword(signinMethodKey, { stepPassToken }) {
  return new CreatePassword({
    onSubmit: async (password) => {
      const serverResult = await fetch(
        `${serverReach}/signin/${signinMethodKey}/withCreatePasswordStep`,
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

        return new Signin.Success({
          user: obj.user,
          signin: obj.signin,
        });
      }

      if (serverResult.status == 428) {
        const text = await serverResult.text();

        if (text.startsWith(`CONFIRM-FOREIGN-CODE:`)) {
          const suffixedData = JSON.parse(
            text.substring(`CONFIRM-FOREIGN-CODE:`.length)
          );

          return createConfirmForeignCode(signinMethodKey, {
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

          return createCreatePassword(signinMethodKey, {
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
