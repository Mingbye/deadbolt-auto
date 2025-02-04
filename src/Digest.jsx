import { VariantError } from "@mingbye/deadbolt";
import { CreatePassword, InputField } from "@mingbye/deadbolt/components";
import { useDialoger } from "@mingbye/react-build-util";
import { useEffect } from "react";
import { serverReach } from "./main";

export default function Digest({ data, finishClose, finishResult }) {
  const dialoger = useDialoger();

  useEffect(() => {
    if (data[0] == `RESULT`) {
      finishResult(data[1]);
    }
  }, []);

  return dialoger(
    (() => {
      if (data[0] == `RESULT`) {
        return `RESULTED: Awaiting next step`;
      }

      if (data[0] == `INPUT-FIELD`) {
        const inputFieldData = data[1];

        return (
          <InputField
            labelPrimary={inputFieldData.labelPrimary}
            labelSecondary={inputFieldData.labelSecondary}
            labelTertiary={inputFieldData.labelTertiary}
            variant={inputFieldData.variant}
            variantData={inputFieldData.variantData}
            next={async (input) => {
              const fetchResult = await fetch(`${serverReach}/inputField`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  carryOver: inputFieldData.carryOver,
                  data: input,
                }),
              });

              if (fetchResult.status == 200) {
                return await fetchResult.json();
              }

              if (fetchResult.status == 400) {
                const bodyObj = await fetchResult.json();
                throw new VariantError(bodyObj.variant, bodyObj.customMessage);
              }

              throw await fetchResult.text();
            }}
            finishClose={() => {
              finishClose();
            }}
            finishResult={(data) => {
              dialoger.open(
                (close) => {
                  return (
                    <Digest
                      data={data}
                      finishClose={() => {
                        close();
                      }}
                      finishResult={(data) => {
                        close();
                        finishResult(data);
                      }}
                    />
                  );
                },
                {
                  width: "100%",
                  height: "100%",
                }
              );
            }}
          />
        );
      }

      if (data[0] == `CREATE-PASSWORD`) {
        const createPasswordData = data[1];

        return (
          <CreatePassword
            labelSecondary={createPasswordData.labelSecondary}
            labelTertiary={createPasswordData.labelTertiary}
            required={createPasswordData.required}
            withInputField={createPasswordData.withInputField}
            next={async (password, withInputField) => {
              const fetchResult = await fetch(`${serverReach}/createPassword`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  carryOver: createPasswordData.carryOver,
                  password: password,
                  withInputField: withInputField,
                }),
              });

              if (fetchResult.status == 200) {
                return await fetchResult.json();
              }

              if (fetchResult.status == 400) {
                const bodyObj = await fetchResult.json();
                throw new VariantError(bodyObj.variant, bodyObj.customMessage);
              }

              throw await fetchResult.text();
            }}
            finishClose={() => {
              finishClose();
            }}
            finishResult={(data) => {
              dialoger.open(
                (close) => {
                  return (
                    <Digest
                      data={data}
                      finishClose={() => {
                        close();
                      }}
                      finishResult={(data) => {
                        close();
                        finishResult(data);
                      }}
                    />
                  );
                },
                {
                  width: "100%",
                  height: "100%",
                }
              );
            }}
          />
        );
      }

      return `UNEXPECTED RESULT`;
    })()
  );
}
