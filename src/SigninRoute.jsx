import { PromiseBuilder, useDialoger } from "@mingbye/react-build-util";
import { Flex, Progress, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { serverReach } from "./main";
import Digest from "./Digest";
import useResolvable from "./useResolvable";
import { CircularProgress } from "@mui/material";
import { Signin } from "@mingbye/deadbolt/components";

export default function SigninRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  const resolvable = useResolvable(
    searchParams.get("resolve"),
    searchParams.get("resolveData"),
    searchParams.get("resolveInStringifiedObject")
  );

  const dialoger = useDialoger();

  const [initializing, setInitializing] = useState(null);

  async function doInitialize() {
    setInitializing(
      (async () => {
        const fetchResult = await fetch(`${serverReach}/signin`);

        if (fetchResult.status == 200) {
          return await fetchResult.json();
        }

        throw await fetchResult.text();
      })()
    );
  }

  useEffect(() => {
    doInitialize();
  }, []);

  return resolvable(
    dialoger(
      <PromiseBuilder
        promise={initializing}
        build={(snapshot) => {
          if (snapshot == null) {
            return (
              <Flex
                vertical
                justify="center"
                align="center"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Flex>
            );
          }

          if (snapshot[0] != true) {
            return (
              <Flex
                vertical
                justify="center"
                align="center"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <Typography.Text
                  style={{
                    fontSize: `1.3rem`,
                    textAlign: "center",
                  }}
                  onClick={() => {
                    console.error(snapshot[1]);
                  }}
                >
                  Failed to setup sign-in
                </Typography.Text>
              </Flex>
            );
          }

          const data = snapshot[1];

          return (
            <Signin
              labelPrimary={data.labelPrimary}
              labelSecondary={data.labelSecondary}
              labelTertiary={data.labelTertiary}
              required={data.required}
              variant={data.variant}
              variantData={data.variantData}
              withSecondaryInputField={data.withSecondaryInputField}
              modaler={dialoger}
              provideOptRecoverCredentials={
                searchParams.get("optRecoverCredentials") == "true"
                  ? () => {
                      resolvable.resolve({
                        code: `recoverCredentials`,
                        data: null,
                      });
                    }
                  : null
              }
              provideOptSignup={
                searchParams.get("optSignup") == "true"
                  ? () => {
                      resolvable.resolve({
                        code: `signup`,
                        data: null,
                      });
                    }
                  : null
              }
              next={async (input, secondaryInput) => {
                const fetchResult = await fetch(`${serverReach}/signin`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    carryOver: searchParams.get("carryOver"),
                    input,
                    secondaryInput,
                  }),
                });

                if (fetchResult.status == 200) {
                  return await fetchResult.json();
                }

                throw await fetchResult.text();
              }}
              finishClose={() => {
                // resolvable.resolve(null);
              }}
              finishResult={async (data) => {
                dialoger.open((close) => {
                  return (
                    <Digest
                      data={data}
                      finishClose={() => {
                        close();
                      }}
                      finishResult={(data) => {
                        close();
                        resolvable.resolve({
                          code: `result`,
                          data: data,
                        });
                      }}
                    />
                  );
                });
              }}
            />
          );
        }}
      />
    )
  );
}
