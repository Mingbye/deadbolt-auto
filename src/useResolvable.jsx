import { PromiseBuilder } from "@mingbye/react-build-util";
import { Button, Flex, Progress, Result, Spin, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { serverReach } from "./main";
/**
 * @param {string} resolve - The type of resolve action to be performed.
 *                           Possible values are "console", "opener", "parent", "channel", or "remote".
 * @param {any} resolveData - Additional data to be used during the resolve process.
 * @param {boolean} resolveInStringifiedObject - Indicates if the resolved value should be first put in a json object then stringified.
 */

export default function useResolvable(
  resolve,
  resolveData,
  resolveInStringifiedObject
) {
  const [resolved, setResolved] = useState(undefined);

  const resolvable = (defaultRender) => {
    return resolved === undefined ? (
      defaultRender
    ) : (
      <Resolved
        value={resolved}
        resolve={resolve}
        resolveData={resolveData}
        resolveInStringifiedObject={resolveInStringifiedObject}
      />
    );
  };

  resolvable.resolve = (value) => {
    setResolved(value);
  };

  return resolvable;
}

function Resolved({ value, resolve, resolveData, resolveInStringifiedObject }) {
  const [initializing, setInitializing] = useState(null);

  const UnknownResolveTypeError = useRef(class {}).current;

  function doSetInitializing() {
    setInitializing(
      (async () => {
        const resolvable = resolveInStringifiedObject
          ? JSON.stringify({
              value: value,
            })
          : value;

        if (resolve == "console") {
          console.log("RESOLVED:", resolvable);
          return;
        }

        if (resolve == "opener") {
          try {
            window.opener.postMessage(resolvable, "*");
          } catch (e) {
            throw `Couldn't post message to opener`;
          }
          return;
        }

        if (resolve == "parent") {
          try {
            window.parent.postMessage(resolvable, "*");
          } catch (e) {
            throw `Couldn't post message to parent`;
          }
          return;
        }

        if (resolve == "channel") {
          try {
            window[resolveData].postMessage(resolvable, "*");
          } catch (e) {
            throw `Couldn't post message to channel [${resolveData}]`;
          }
          return;
        }

        if (resolve == "remote") {
          const response = await fetch(`${serverReach}/remoteResolve`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key: resolveData,
              resolvable: resolvable,
            }),
          });

          if (response.ok) {
            return;
          }

          throw `Remote resolve failed: ${response.statusText}`;
        }

        throw new UnknownResolveTypeError();
      })()
    );
  }

  useEffect(() => {
    doSetInitializing();
  }, []);

  return (
    <PromiseBuilder
      promise={initializing}
      build={(snapshot) => {
        if (snapshot == null) {
          return (
            <Flex
              vertical
              align="center"
              justify="center"
              gap="20px"
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <Progress />
            </Flex>
          );
        }

        if (snapshot[0] == false) {
          if (snapshot[1] instanceof UnknownResolveTypeError) {
            return (
              <Flex
                vertical
                align="center"
                justify="center"
                gap="20px"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <Typography.Text>
                  Can't proceed with [resolve: {resolve}]
                </Typography.Text>
              </Flex>
            );
          }

          return (
            <Flex
              vertical
              align="center"
              justify="center"
              gap="20px"
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <Typography.Text>
                An error has occurred while proceeding
              </Typography.Text>
              <Button
                onClick={() => {
                  doSetInitializing();
                }}
              >
                Retry
              </Button>
            </Flex>
          );
        }

        return (
          <Flex
            vertical
            align="center"
            justify="center"
            gap="20px"
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <Spin />
            <Typography.Text>Awaiting client to proceed</Typography.Text>
            <Typography.Text>
              If this is taking too long, something failed. Close this window
              manually and retry the process
            </Typography.Text>
          </Flex>
        );
      }}
    />
  );
}
