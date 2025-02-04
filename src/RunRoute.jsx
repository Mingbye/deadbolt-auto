import { PromiseBuilder, useDialoger } from "@mingbye/react-build-util";
import { Flex, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { serverReach } from "./main";
import Digest from "./Digest";
import useResolvable from "./useResolvable";

export default function RunRoute({}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const resolvable = useResolvable(
    searchParams.get("resolve"),
    searchParams.get("resolveData"),
    searchParams.get("resolveInStringifiedObject")
  );

  const dialoger = useDialoger();

  const [initializing, setInitializing] = useState(null);

  async function doRunRun() {
    setInitializing(
      (async () => {
        const fetchResult = await fetch(`${serverReach}/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            carryOver: searchParams.get("carryOver"),
          }),
        });

        if (fetchResult.status == 200) {
          return await fetchResult.json();
        }

        throw await fetchResult.text();
      })()
    );
  }

  useEffect(() => {
    doRunRun();
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
                <Spin />
              </Flex>
            );
          }

          if (snapshot[0] != true) {
            return <Typography.Text>Failed to fetch data</Typography.Text>;
          }

          const runResult = snapshot[1];

          return (
            <Digest
              data={runResult}
              finishClose={() => {
                resolvable.resolve({
                  code: null,
                  data: null,
                });
              }}
              finishResult={(data) => {
                resolvable.resolve({
                  code: `result`,
                  data: data,
                });
              }}
            />
          );
        }}
      />
    )
  );
}
