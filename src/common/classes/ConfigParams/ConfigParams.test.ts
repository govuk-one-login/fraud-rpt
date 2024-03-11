import { expect, describe, it } from "@jest/globals";
import { ConfigParams } from "./ConfigParams";
import { ErrorMessages } from "../../enums/ErrorMessages";
import {
  ExpectedResponses,
  SampleConfigs,
} from "../../testEvents/SampleEvents";
import { InboundPipelineURLs } from "../../enums/InboundPipelineURLs";

let environment: keyof typeof InboundPipelineURLs = "development";
beforeEach(() => {
  jest.resetAllMocks();
});

describe("configParams", () => {
  it("should be defined", async () => {
    expect(ConfigParams).toBeDefined();
  });

  it("should initialise to some default config params", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    const schema = {
      numMessages: expect.any(Number),
      rpSplit: expect.any(Array<number>),
      eventTypeSplit: expect.any(Array<number>),
      errorRate: expect.any(Number),
    };
    expect(configParams.configParams).toMatchObject(schema);
  });
});

describe("parseAllApiParams", () => {
  it("should be defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    expect(configParams.parseAllApiParams).toBeDefined();
  });

  it("should call the functions to parse each property", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    jest.spyOn(configParams, "parseNumMessages");
    jest.spyOn(configParams, "parseRpSplit");
    jest.spyOn(configParams, "parseEventTypeSplit");
    jest.spyOn(configParams, "parseErrorRate");
    jest.spyOn(configParams, "parseInboundEndpointURL");

    await configParams.parseAllApiParams(SampleConfigs.ValidFullConfigEvent);

    expect(configParams.parseNumMessages).toBeCalled();
    expect(configParams.parseRpSplit).toBeCalled();
    expect(configParams.parseEventTypeSplit).toBeCalled();
    expect(configParams.parseErrorRate).toBeCalled();
    expect(configParams.parseInboundEndpointURL).toBeCalled();
  });

  it("should change the parameters supplied", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);

    await configParams.parseAllApiParams(SampleConfigs.ValidFullConfigEvent);

    expect(configParams.configParams.numMessages).toStrictEqual(20);
    expect(configParams.configParams.rpSplit).toStrictEqual([0.25, 0.5, 0.25]);
    expect(configParams.configParams.eventTypeSplit).toStrictEqual([
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(configParams.configParams.errorRate).toStrictEqual(0.2);
    expect(configParams.configParams.inboundEndpointURL).toStrictEqual(
      "testUrl.gov.uk",
    );
  });

  it("should not change the parameters not defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);

    await configParams.parseAllApiParams({});

    // These are (should be) the default values assigned in the constructor
    expect(configParams.configParams.numMessages).toStrictEqual(10);
    expect(configParams.configParams.rpSplit).toStrictEqual([1, 0, 0]);
    expect(configParams.configParams.eventTypeSplit).toStrictEqual([
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(configParams.configParams.errorRate).toStrictEqual(0);
    expect(configParams.configParams.inboundEndpointURL).toStrictEqual(
      InboundPipelineURLs.development,
    );
  });

  it.each([
    [
      SampleConfigs.InvalidFullConfigEvent,
      ExpectedResponses.InvalidFullConfigEvent.body,
    ],
    [
      SampleConfigs.InvalidPartialOneConfigEvent,
      ExpectedResponses.InvalidPartialOneConfigEvent.body,
    ],
    [
      SampleConfigs.InvalidPartialTwoConfigEvent,
      ExpectedResponses.InvalidPartialTwoConfigEvent.body,
    ],
  ])(
    "should handle rejecting multiple invalid entries",
    async (paramJson, expectedResponse) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await expect(() =>
        configParams.parseAllApiParams(paramJson),
      ).rejects.toThrowError(expectedResponse);
    },
  );
});

describe("parseNumMessages", () => {
  it("should be defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    expect(configParams.parseNumMessages).toBeDefined();
  });

  it.each([5, -5, 4.9])(
    "should change the parameters for a valid event property",
    async (validEntry) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await configParams.parseNumMessages({ numMessages: validEntry });
      expect(configParams.configParams.numMessages).toStrictEqual(5);
    },
  );

  it("should make no changes if the parameter is not defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    await configParams.parseNumMessages({});
    expect(configParams.configParams.numMessages).toStrictEqual(10);
  });

  it.each(["5", [[1, 1]]])(
    "should reject inproper entries",
    async (invalidEntry) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await expect(() =>
        configParams.parseNumMessages({ numMessages: invalidEntry }),
      ).rejects.toThrowError(ErrorMessages.ConfigParams.NumMessagesInvalid);
    },
  );
});

describe("parseRpSplit", () => {
  it("should be defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    expect(configParams.parseRpSplit).toBeDefined();
  });

  it.each([
    [1, 2, 1],
    [-1, 2, 1],
    [0.9, 2.1, 1.1],
  ])("should change the parameters for a valid event property", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    await configParams.parseRpSplit(SampleConfigs.ValidRpSplitConfigEvent);
    expect(configParams.configParams.rpSplit).toStrictEqual([0.25, 0.5, 0.25]);
  });

  it("should make no changes if the parameter is not defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    await configParams.parseRpSplit({});
    expect(configParams.configParams.rpSplit).toStrictEqual([1, 0, 0]);
  });

  it.each([1, [[1]], "[1,1]", [["1", "1"]], [[1, 1, 1]]])(
    "should reject inproper enties",
    async (invalidEntry) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await expect(() =>
        configParams.parseRpSplit({ rpSplit: invalidEntry }),
      ).rejects.toThrowError(ErrorMessages.ConfigParams.RpSplitInvalid);
    },
  );
});

describe("parseEventTypeSplit", () => {
  it("should be defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    expect(configParams.parseEventTypeSplit).toBeDefined();
  });

  it.each([
    [
      SampleConfigs.ValidEventTypeSplitConfigEvent.eventTypeSplit,
      [0.25, 0.25, 0.25, 0.25, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  ])(
    "should change the parameters for a valid event property",
    async (validEntry, expectedResponse) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await configParams.parseEventTypeSplit({ eventTypeSplit: validEntry });
      expect(configParams.configParams.eventTypeSplit).toStrictEqual(
        expectedResponse,
      );
    },
  );

  it("should make no changes if the parameter is not defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    await configParams.parseEventTypeSplit({});
    expect(configParams.configParams.eventTypeSplit).toStrictEqual([
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it.each([
    SampleConfigs.InvalidEventTypeSplitConfigEventOne.eventTypeSplit,
    SampleConfigs.InvalidEventTypeSplitConfigEventTwo.eventTypeSplit,
  ])("should reject inproper enties", async (invalidEntry) => {
    const configParams: ConfigParams = new ConfigParams(environment);
    await expect(() =>
      configParams.parseEventTypeSplit({ eventTypeSplit: invalidEntry }),
    ).rejects.toThrowError(ErrorMessages.ConfigParams.EventTypeSplitInvalid);
  });
});

describe("parseErrorRate", () => {
  it("should be defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    expect(configParams.parseErrorRate).toBeDefined();
  });

  it.each([0.2, -0.2])(
    "should change the parameters for a valid event property",
    async (validEntry) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await configParams.parseErrorRate({ errorRate: validEntry });
      expect(configParams.configParams.errorRate).toStrictEqual(0.2);
    },
  );

  it("should make no changes if the parameter is not defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    await configParams.parseErrorRate({});
    expect(configParams.configParams.errorRate).toStrictEqual(0);
  });

  it.each([2, -2, "0.2", [2]])(
    "should reject inproper enties",
    async (invalidEntry) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await expect(() =>
        configParams.parseErrorRate({ errorRate: invalidEntry }),
      ).rejects.toThrowError(ErrorMessages.ConfigParams.ErrorRateInvalid);
    },
  );
});

describe("parseInboundEndpointURL", () => {
  it("should be defined", async () => {
    const configParams: ConfigParams = new ConfigParams(environment);
    expect(configParams.parseInboundEndpointURL).toBeDefined();
  });

  it.each(["testUrl1.gov.uk", "testUrl2.gov.uk"])(
    "should change the parameters for a valid event property",
    async (validEntry) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await configParams.parseInboundEndpointURL({
        inboundEndpointURL: validEntry,
      });
      expect(configParams.configParams.inboundEndpointURL).toStrictEqual(
        validEntry,
      );
    },
  );

  it.each(["development", "build", "staging"])(
    "should take the environment default URL if none specified",
    async (environmentOverride) => {
      const deploymentEnvironment =
        environmentOverride as keyof typeof InboundPipelineURLs;
      const configParams: ConfigParams = new ConfigParams(
        deploymentEnvironment,
      );
      await configParams.parseErrorRate({});
      expect(configParams.configParams.inboundEndpointURL).toStrictEqual(
        InboundPipelineURLs[deploymentEnvironment],
      );
    },
  );

  it.each([2, -2, "0.2", [2]])(
    "should reject inproper enties",
    async (invalidEntry) => {
      const configParams: ConfigParams = new ConfigParams(environment);
      await expect(() =>
        configParams.parseErrorRate({ errorRate: invalidEntry }),
      ).rejects.toThrowError(ErrorMessages.ConfigParams.ErrorRateInvalid);
    },
  );
});
