import { describe, expect, it } from "@jest/globals";
import { MockSET } from "./MockSET";
import { issSubEventURIs } from "../../enums/eventsEnums";

beforeEach(() => {
  jest.resetAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("mockSET", () => {
  it("should be defined", async () => {
    expect(MockSET).toBeDefined();
  });

  it("should initialise a default set", async () => {
    const mockSET: MockSET = new MockSET();
    const schema = {
      iss: expect.any(String),
      iat: expect.any(Number),
      jti: expect.any(String),
      aud: expect.any(String),
      events: expect.any(String),
    };
    expect(mockSET.mockSET).toMatchObject(schema);
  });
});

describe("generateUniqueID", () => {
  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.generateUniqueID).toBeDefined();
  });

  it("should return a random string for the jti field", async () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0);

    const mockDate = new Date(70, 0, 1, 1, 0, 0, 0);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate); // 1st, Jan, 1970 00:00:00.00, This should return a time of 0,
    const mockSET: MockSET = new MockSET();
    await mockSET.fillStaticFields();

    expect(mockSET.mockSET.jti).toBe("AAAAAAAA" + mockDate.getTime());
  });

  it("should not return the same string twice", async () => {
    const mockSET1: MockSET = new MockSET();
    await mockSET1.fillStaticFields();

    const mockSET2: MockSET = new MockSET();
    await mockSET2.fillStaticFields();

    expect(mockSET1.mockSET.jti).not.toBe(mockSET2.mockSET.jti);
  });
});

describe("adjustRpOfOrigin", () => {
  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.adjustRpOfOrigin).toBeDefined();
  });

  it.each([
    [[1, 0, 0], "https://MockRP1.account.gov.uk/"],
    [[0, 1, 0], "https://MockRP2.account.gov.uk/"],
    [[0, 0, 1], "https://MockRP3.account.gov.uk/"],
  ])(
    "should change the iss value according according to the rpSplit",
    async (rpSplit, issExpected) => {
      jest.spyOn(global.Math, "random").mockReturnValue(0); //Ensure it picks user 1

      const mockSET: MockSET = new MockSET();
      await mockSET.adjustRpOfOrigin(rpSplit);

      expect(mockSET.mockSET.iss).toBe(issExpected);
    },
  );

  it.each([
    [0.33, "uri:fdc:gov.uk:2022:RP1_User1_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw="],
    [0.66, "uri:fdc:gov.uk:2022:RP1_User2_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw="],
    [0.99, "uri:fdc:gov.uk:2022:RP1_User3_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw="],
  ])(
    "should return each of the three users for RP1",
    async (neededRandomValue, subExpected) => {
      jest.spyOn(global.Math, "random").mockReturnValue(neededRandomValue); //Ensure it picks user 1

      const mockSET: MockSET = new MockSET();
      // set RP of origin, always choose first user at RP
      const pairwiseId = await mockSET.adjustRpOfOrigin([1, 0, 0]);
      // set event type to the first element of the events enum, also set the pairwise ID
      await mockSET.adjustEvent([1, 0], pairwiseId);

      expect(
        mockSET.mockSET.events[Object.values(issSubEventURIs)[0]].subject.uri,
      ).toBe(subExpected);
    },
  );
});

describe("adjustEvent", () => {
  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.adjustEvent).toBeDefined();
  });

  it.each([
    [
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.accountBlock,
    ],
    [
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.accountConcern,
    ],
    [
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.accountPurged,
    ],
    [
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.accountCredentialChangeRequired,
    ],
    [
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.accountDisabled,
    ],
    [
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.accountEnabled,
    ],
    [
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.credentialCompromise,
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.deviceConcern,
    ],
    [[0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], issSubEventURIs.optIn],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      issSubEventURIs.optOutInitiated,
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
      issSubEventURIs.optOutCancelled,
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      issSubEventURIs.optOutEffective,
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      issSubEventURIs.recoveryActivated,
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      issSubEventURIs.recoveryInformationChanged,
    ],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      issSubEventURIs.sessionsRevoked,
    ],
  ])(
    "should change the events according according to the eventSplit to get each event",
    async (eventSplit, expectedURI) => {
      const mockSET: MockSET = new MockSET();
      await mockSET.adjustEvent(eventSplit, "some-uri");

      expect(JSON.stringify(mockSET.mockSET.events)).toContain(expectedURI);
    },
  );
});

describe("addError", () => {
  beforeEach(() => {});

  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.addError).toBeDefined();
  });

  it("should error a random field", async () => {
    const mockSET: MockSET = new MockSET();
    await mockSET.addError(1);
    expect(
      Object.values(mockSET.mockSET).some((value) => value === undefined),
    ).toBeTruthy();
  });

  it.each([
    ["iss", 0 / 5],
    ["iat", 1 / 5],
    ["jti", 2 / 5],
    ["aud", 3 / 5],
    ["events", 0.99],
  ])(
    "should error only the chosen field",
    async (fieldToBeErrored, randomResultForField) => {
      jest.spyOn(global.Math, "random").mockReturnValue(randomResultForField);

      const mockSET: MockSET = new MockSET();
      await mockSET.addError(1);

      const fieldKey = fieldToBeErrored as keyof typeof mockSET.mockSET;
      expect(mockSET.mockSET[fieldKey]).toBe(undefined);

      const fields: any = JSON.parse(JSON.stringify(mockSET.mockSET));
      let definedFieldsCounter: number = 0;
      for (const key in fields) {
        if (fields[key] !== undefined) {
          definedFieldsCounter++;
        }
      }
      expect(definedFieldsCounter).toBe(4);
    },
  );
});

describe("weightedChoiceFromArray", () => {
  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.weightedChoiceFromArray).toBeDefined();
  });

  it("should not pick one choice a statistically unlikely number of times", async () => {
    const mockSET: MockSET = new MockSET();
    let choiceTracker = 0;
    let choice: string;
    for (let i = 0; i < 100; i++) {
      choice = await mockSET.weightedChoiceFromArray(
        ["choice1", "choice2"],
        [0.5, 0.5],
      );
      if (choice === "choice1") {
        choiceTracker += 1;
      }
    }
    expect(choiceTracker).toBeGreaterThan(10);
    expect(choiceTracker).toBeLessThan(90);
  });
});
