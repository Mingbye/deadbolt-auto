import { Signup } from "@mingbye/deadbolt/components";
import { PromiseBuilder, useDialoger } from "@mingbye/react-build-util";
import { CircularProgress } from "@mui/material";
import { Flex, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Digest from "./Digest";
import { serverReach } from "./main";
import useResolvable from "./useResolvable";

export default function SignupRoute() {
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
        const fetchResult = await fetch(`${serverReach}/signup`);

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
                  Failed to setup sign-up
                </Typography.Text>
              </Flex>
            );
          }

          const data = snapshot[1];

          return (
            <Signup
              labelPrimary={data.labelPrimary}
              labelSecondary={data.labelSecondary}
              labelTertiary={data.labelTertiary}
              required={data.required}
              variant={data.variant}
              variantData={data.variantData}
              modaler={dialoger}
              provideOptSignin={
                searchParams.get("optSignin") == "true"
                  ? () => {
                      resolvable.resolve({
                        code: `signin`,
                        data: null,
                      });
                    }
                  : null
              }
              next={async (input) => {
                const fetchResult = await fetch(`${serverReach}/signup`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    carryOver: searchParams.get("carryOver"),
                    input,
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
