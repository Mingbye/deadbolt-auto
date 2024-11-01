import { useEffect, useState } from "react";
import {
  ConfirmForeignCode,
  Signin,
  Signup,
  SolveAntiRobotChallenge,
  CreatePassword,
} from "@mingbye/deadbolt-react";
import PromiseBuilder from "./PromiseBuilder";

const signinMethod = new Signin.Id({
  type: new Signin.Id.Type.EmailAddress(),
  usePassword: true,
  onSubmitId: async (id, password) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    const solveAntiRobotChallengeNextStepToken = `null`;

    return new SolveAntiRobotChallenge({
      createChallenge: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });

        const ref = `null`;
        const imgSrc = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII`;

        return new SolveAntiRobotChallenge.Challenge({
          ref,
          solvable: new SolveAntiRobotChallenge.Challenge.Solvable.TextFromImg({
            src: imgSrc,
            trimInput: true,
            onSubmit: async () => {
              await new Promise((resolve) => {
                setTimeout(resolve, 2000);
              });

              const confirmForeignCodeToken = `null:nextStepToken`;

              return new ConfirmForeignCode({
                codePlacement: new ConfirmForeignCode.CodePlacement.SentInEmail(
                  id
                ),
                trimInput: true,
                onSubmit: async (code) => {
                  await new Promise((resolve) => {
                    setTimeout(resolve, 2000);
                  });

                  const user = `null:${id}`;
                  const signin = `null:${password}`;

                  return new Signin.Success({
                    user,
                    signin,
                  });
                },
              });

              const user = `null:${id}`;
              const signin = `null:${password}`;

              return new Signin.Success({
                user,
                signin,
              });
            },
          }),
        });
      },
    });
  },
});

const signupMethod = new Signup.Id({
  type: new Signup.Id.Type.EmailAddress(),
  onSubmitId: async (id) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    const solveAntiRobotChallengeNextStepToken = `null`;

    return new SolveAntiRobotChallenge({
      createChallenge: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });

        const ref = `null`;
        const imgSrc = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII`;

        return new SolveAntiRobotChallenge.Challenge({
          ref,
          solvable: new SolveAntiRobotChallenge.Challenge.Solvable.TextFromImg({
            src: imgSrc,

            trimInput: true,

            onSubmit: async () => {
              await new Promise((resolve) => {
                setTimeout(resolve, 2000);
              });

              const confirmForeignCodeToken = `null:nextStepToken`;

              return new ConfirmForeignCode({
                codePlacement: new ConfirmForeignCode.CodePlacement.SentInEmail(
                  id
                ),
                trimInput: true,
                onSubmit: async (code) => {
                  await new Promise((resolve) => {
                    setTimeout(resolve, 2000);
                  });

                  const createPasswordToken = `null:nextStepToken`;

                  return new CreatePassword({
                    onSubmit: async (password) => {
                      await new Promise((resolve) => {
                        setTimeout(resolve, 2000);
                      });

                      const user = `null:${id}`;
                      const autoSigninToken = `null:${password}`;

                      return new Signup.Success({
                        user,
                        autoSigninToken,
                      });
                    },
                  });
                },
              });
            },
          }),
        });
      },
    });
  },
});

function App_() {
  // return (
  //   <Signup
  //     signupMethod={signupMethod}
  //     provideOptSignin={() => {}}
  //     onResult={(result) => {
  //       // alert("resulted!");
  //       console.log(result);
  //     }}
  //   />
  // );

  return (
    <Signin
      signinMethod={signinMethod}
      provideOptSignup={() => {}}
      onResult={(result) => {
        // alert("resulted!");
        console.log(result);
      }}
    />
  );
}

//for deadbot-auto

// const serverReachPathname = path.normalize(
//   path.join(window.location.pathname, `../../serve`)
// );

// const serverReach=`${window.location.host}/${serverReachPathname}`;

const serverReach = `http://localhost/app/deadbolt/serve`;

export default function App() {
  const [gettingDeadboltAutoData, setGettingDeadboltAutoData] = useState(null);

  async function doGetDeadboltAutoData() {
    setGettingDeadboltAutoData(
      (async function () {
        const result = await fetch(`${serverReach}`, {
          method: "POST",
        });

        return await result.json();
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
      }}
    >
      {gettingDeadboltAutoData != null ? (
        <PromiseBuilder
          promise={gettingDeadboltAutoData}
          builder={(snapshot) => {
            if (snapshot == null) {
              return "LOADING";
            }

            if (snapshot[0] != true) {
              return "AN ERROR OCCURED";
            }

            const deadboltAutoData = snapshot[1];
          }}
        />
      ) : null}
    </div>
  );
}
