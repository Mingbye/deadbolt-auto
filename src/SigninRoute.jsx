import { useEffect, useState } from "react";
import PromiseBuilder from "./PromiseBuilder";
import {
  ConfirmForeignCode,
  Signin,
  SolveAntiRobotChallenge,
} from "@mingbye/deadbolt-react";
import { CircularProgress, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import resolveSignin from "./resolveSignin";

const serverReach = `http://localhost/app/deadbolt`;

export default function SigninRoute() {
  const navigate = useNavigate();

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
                <Typography align="center">Failed to setup sign-in</Typography>
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
                    ////////////
                    async function result(serverResult) {
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

                          return new ConfirmForeignCode({
                            codeWhere: suffixedData.codeWhere,
                            codeWhereIdentifier:
                              suffixedData.codeWhereIdentifier,
                            trimInput: suffixedData.trimInput,
                            onSubmit: async (code) => {
                              const serverResult = await fetch(
                                `${serverReach}/signin/${key}/withConfirmForeignCodeStep`, 
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
 
                        // if (text.startsWith(`SOLVE-ANTI-ROBOT-CHALLENGE:`)) {
                        //   const suffixedData = JSON.parse(
                        //     text.substring(`SOLVE-ANTI-ROBOT-CHALLENGE:`.length)
                        //   );

                        //   return new SolveAntiRobotChallenge({
                        //     createChallenge: async () => {
                        //       throw new Error();
                        //     },
                        //   });
                        // }
                      }

                      throw await serverResult.text();
                    }

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

                    return await result(serverResult);
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

                        _searchParams.set("optSignin", "true");
                        _searchParams.set("signin", "true");

                        if (searchParams.has("resolve")) {
                          _searchParams.set(
                            "signinResolve",
                            searchParams.get("resolve")
                          );
                        }

                        navigate(`/signup?${_searchParams.toString()}`);
                      }
                    : undefined
                }
                onResult={(result) => {
                  const signinResolve = searchParams.get("resolve");

                  resolveSignin(signinResolve, result);
                }}
              />
            );
          }}
        />
      ) : null}
    </div>
  );
}
