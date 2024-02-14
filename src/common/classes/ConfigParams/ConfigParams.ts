import { ErrorMessages } from "../../enums/ErrorMessages";
import { ActivationApiConfigParams } from "../../interfaces/interfaces";
import { MockRPs } from '../MockSET/MockRPs';
import { validEventKeys } from "../../enums/eventsEnums";
import { InboundPipelineURLs } from "../../enums/InboundPipelineURLs";

export class ConfigParams {
  configParams: ActivationApiConfigParams;

  constructor(environment: keyof typeof InboundPipelineURLs) {
    // Start with default values
    this.configParams = {
      numMessages: 10,
      rpSplit: [1, 0, 0],
      eventTypeSplit: Array(12).fill(1, 0).fill(0, 1),
      errorRate: 0,
      inboundEndpointURL: InboundPipelineURLs[environment],
    };
  }

  /**
   * Function that allows the exectution and error handling of the parsing functions simultaneously
   *
   * @param eventJson is the json body passed through from the api. Expected to be the format detailed in the read me.
   */
  public async parseAllApiParams(eventJson: any) {
    const response: PromiseSettledResult<void>[] = await Promise.allSettled([
      this.parseNumMessages(eventJson),
      this.parseRpSplit(eventJson),
      this.parseEventTypeSplit(eventJson),
      this.parseErrorRate(eventJson),
      this.parseInboundEndpointURL(eventJson),
    ]);

    let errorMessages: PromiseSettledResult<void>[] = response.filter(
      (entry) => entry.status === "rejected",
    );
    if (errorMessages.length > 0) {
      const errorMessage: string = errorMessages
        .map((entry) => this.errorTypeGuard(entry) && entry.reason)
        .map((entry) => entry.toString().replace("ReferenceError: ", ""))
        .reduce((concatString, string) => concatString + "\n" + string);
      throw new ReferenceError(errorMessage);
    }
  }

  /**
   * Typeguarding to confirm that the error handling is using a PromiseRejectedResult, not settled
   *
   * @param promiseResult is the result of the promise, expected to be a rejected result
   */
  public errorTypeGuard(
    promiseResult: PromiseSettledResult<void> | PromiseRejectedResult,
  ): promiseResult is PromiseRejectedResult {
    return "reason" in promiseResult;
  }

  /**
   * Function which parses the numMessages field of the eventJson, should it exist, and updates the configParams instance value.
   *
   * @param eventJson is the json body passed through from the api. Expected to be the format detailed in the read me.
   */
  public async parseNumMessages(eventJson: any) {
    if (!eventJson.numMessages) {
      return;
    }
    if (typeof eventJson?.numMessages !== "number") {
      throw new ReferenceError(ErrorMessages.ConfigParams.NumMessagesInvalid); // more specific errors than invalid?
    }
    //seems to default to 1 if you put 0, not throw error? Have it handle "1" as 1??
    this.configParams.numMessages = Math.ceil(Math.abs(eventJson.numMessages));
  }

  /**
   * Function which parses the rpSplit field of the eventJson, should it exist, and updates the configParams instance value.
   *
   * @param eventJson is the json body passed through from the api. Expected to be the format detailed in the read me.
   */
  public async parseRpSplit(eventJson: any) {
    if (!eventJson.rpSplit) {
      return;
    }
    if (
      !Array.isArray(eventJson?.rpSplit) ||
      eventJson?.rpSplit.every(
        (arrayValue: number) => typeof arrayValue !== "number",
      ) ||
      eventJson.rpSplit.length !== Object.keys(MockRPs).length
    ) {
      throw new ReferenceError(ErrorMessages.ConfigParams.RpSplitInvalid);
    }

    this.configParams.rpSplit = await this.getProbabilitiyArray(
      eventJson.rpSplit,
    );
  }

  /**
   * Function which parses the eventType field of the eventJson, should it exist, and updates the configParams instance value.
   *
   * @param eventJson is the json body passed through from the api. Expected to be the format detailed in the read me.
   */
  public async parseEventTypeSplit(eventJson: any) {
    if (!eventJson.eventTypeSplit) {
      return;
    }
    if (
      !validEventKeys.every(
        (key) =>
          key in eventJson.eventTypeSplit &&
          typeof eventJson.eventTypeSplit[key] === "number",
      )
    ) {
      throw new ReferenceError(
        ErrorMessages.ConfigParams.EventTypeSplitInvalid,
      );
    }

    this.configParams.eventTypeSplit = await this.getProbabilitiyArray(
      Object.values(eventJson.eventTypeSplit),
    );
  }

  /**
   * Function which parses the errorRate field of the eventJson, should it exist, and updates the configParams instance value.
   *
   * @param eventJson is the json body passed through from the api. Expected to be the format detailed in the read me.
   */
  public async parseErrorRate(eventJson: any) {
    if (!eventJson.errorRate) {
      return;
    }
    if (
      typeof eventJson?.errorRate !== "number" ||
      Math.abs(eventJson?.errorRate) > 1
    ) {
      throw new ReferenceError(ErrorMessages.ConfigParams.ErrorRateInvalid);
    }
    this.configParams.errorRate = Math.abs(eventJson.errorRate);
  }

  /**
   * Function which parses the inboundEndpointURL field of the eventJson, should it exist, and updates the configParams instance value.
   *
   * @param eventJson is the json body passed through from the api. Expected to be the format detailed in the read me.
   */
  public async parseInboundEndpointURL(eventJson: any) {
    if (!eventJson.inboundEndpointURL) {
      return;
    }
    if (typeof eventJson?.inboundEndpointURL !== "string") {
      throw new ReferenceError(
        ErrorMessages.ConfigParams.InboundEndpointURLInvalid,
      );
    }
    this.configParams.inboundEndpointURL = eventJson.inboundEndpointURL;
  }

  /**
   *  Function which normalises an array such that the array sum is 1.
   *
   * @param array is an array of numbers.
   * @returns the normalised array
   */
  public async getProbabilitiyArray(
    array: Array<number>,
  ): Promise<Array<number>> {
    array = array.map((arrayValue) => Math.abs(arrayValue));
    const arrayTotal: number = array.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
    );
    array = array.map((arrayValue) => arrayValue / arrayTotal);
    return array;
  }
}
