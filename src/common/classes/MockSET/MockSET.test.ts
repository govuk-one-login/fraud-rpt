import { expect, describe, it } from "@jest/globals";
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
      sub: expect.any(String),
      txn: expect.any(String),
      toe: expect.any(Number),
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

describe("generateTimeOfEvent", () => {
  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.generateTimeOfEvent).toBeDefined();
  });

  it("should return a random string for the jti field", async () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0);

    const mockDate = new Date(70, 0, 1, 1, 0, 0, 0);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate); // 1st, Jan, 1970 00:00:00.00, This should return a time of 0,
    const mockSET: MockSET = new MockSET();
    await mockSET.fillStaticFields();

    expect(mockSET.mockSET.toe).toBe(mockDate.getTime());
  });
});

describe("adjustRpOfOrigin", () => {
  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.adjustRpOfOrigin).toBeDefined();
  });

  it.each([
    [[1, 0, 0], "https://MockRP1.account.gov.uk/publicKey/", "RP1USER1"],
    [[0, 1, 0], "https://MockRP2.account.gov.uk/publicKey/", "RP2USER1"],
    [[0, 0, 1], "https://MockRP3.account.gov.uk/publicKey/", "RP3USER1"],
  ])(
    "should change the iss and sub values according according to the rpSplit",
    async (rpSplit, issExpected, subExpected) => {
      jest.spyOn(global.Math, "random").mockReturnValue(0); //Ensure it picks user 1

      const mockSET: MockSET = new MockSET();
      await mockSET.adjustRpOfOrigin(rpSplit);

      expect(mockSET.mockSET.iss).toBe(issExpected);
      expect(mockSET.mockSET.sub).toBe(subExpected);
    },
  );

  it.each([
    [0.33, "RP1USER1"],
    [0.66, "RP1USER2"],
    [0.99, "RP1USER3"],
  ])(
    "should return each of the three users for RP1",
    async (neededRandomValue, subExpected) => {
      jest.spyOn(global.Math, "random").mockReturnValue(neededRandomValue); //Ensure it picks user 1

      const mockSET: MockSET = new MockSET();
      await mockSET.adjustRpOfOrigin([1, 0, 0]);

      expect(mockSET.mockSET.sub).toBe(subExpected);
    },
  );
});

describe("adjustEvent", () => {
  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
    expect(mockSET.adjustEvent).toBeDefined();
  });

  it.each([
    [[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], issSubEventURIs.accountPurged],
    [
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.accountCredentialChangeRequired,
    ],
    [[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], issSubEventURIs.accountDisabled],
    [[0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], issSubEventURIs.accountEnabled],
    [
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      issSubEventURIs.credentialCompromise,
    ],
    [[0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], issSubEventURIs.optIn],
    [[0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], issSubEventURIs.optOutInitiated],
    [[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], issSubEventURIs.optOutCancelled],
    [[0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], issSubEventURIs.optOutEffective],
    [[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], issSubEventURIs.recoveryActivated],
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      issSubEventURIs.recoveryInformationChanged,
    ],
    [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], issSubEventURIs.sessionsRevoked],
  ])(
    "should change the events according according to the eventSplit to get each event",
    async (eventSplit, expectedURI) => {
      const mockSET: MockSET = new MockSET();
      await mockSET.adjustEvent(eventSplit);

      expect(JSON.stringify(mockSET.mockSET.events)).toContain(expectedURI);
    },
  );
});

describe("addError", () => {
  beforeEach(() => {});

  it("should be defined", async () => {
    const mockSET: MockSET = new MockSET();
  });

  it("should error a random field", async () => {
    const mockSET: MockSET = new MockSET();
    await mockSET.addError(1);
    expect(
      Object.values(mockSET.mockSET).some((value) => value === undefined),
    ).toBeTruthy();
  });

  it.each([
    ["iss", 0 / 7],
    ["iat", 1 / 7],
    ["jti", 2 / 7],
    ["aud", 3 / 7],
    ["sub", 4 / 7],
    ["txn", 5 / 7],
    ["toe", 6 / 7],
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
      expect(definedFieldsCounter).toBe(7);
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
