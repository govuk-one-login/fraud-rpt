import { ErroneousJsonMockSET, JsonMockSET } from '../../interfaces/interfaces';
import { MockRPs } from './MockRPs';
import { EventTypes, validEventKeys } from '../../enums/eventsEnums';
import { EventMapping } from '../MockEvents/EventMapping';
import { BaseEvent } from '../MockEvents/events/BaseEvent';
export class MockSET {
  mockSET: JsonMockSET | ErroneousJsonMockSET;

  constructor() {
    this.mockSET = {
      iss: 'https://MockRP1.account.gov.uk/publicKey/',
      jti: '1111AAAA',
      iat: 0,
      aud: 'https://inbound.ssf.account.gov.uk/',
      sub: 'RP1USER1',
      txn: '2222BBBB',
      toe: 10,
      events: 'No event supplied',
    };
  }

  /**
   * Ensures all promises resolve for adjusting the static fields (ones not based of config params)
   */
  public async fillStaticFields(): Promise<void> {
    this.mockSET.jti = await this.generateUniqueID();
    this.mockSET.iat = new Date().getTime();
    this.mockSET.txn = await this.generateUniqueID();
    this.mockSET.toe = await this.generateTimeOfEvent();
  }

  /**
   * Generates a unique ID based off the Time with 8 random letters interspersed
   * Technically a *very* low chance of the same ID being generated if both at same millisecond
   *
   * @returns The unique ID string
   */
  public async generateUniqueID(): Promise<string> {
    const time: number = new Date().getTime();
    const characters: string =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let uniqueID: string = time.toString();

    let randomIndex: number = 0;
    let randomChar: string = '';
    for (let i = 0; i < 8; i++) {
      randomIndex = Math.floor(Math.random() * uniqueID.length);
      randomChar = characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
      uniqueID =
        uniqueID.slice(0, randomIndex) +
        randomChar +
        uniqueID.slice(randomIndex);
    }
    return uniqueID;
  }

  /**
   * Gets the current time and takes away up to 24 hours worth of milliseconds (86400000)
   *
   * @returns a random time from the last 24 hours
   */
  public async generateTimeOfEvent(): Promise<number> {
    const currentTime: number = new Date().getTime();
    const twentyFourHoursInMilliSeconds: number = 86400000;
    return (
      currentTime - Math.round(Math.random() * twentyFourHoursInMilliSeconds)
    );
  }

  /**
   * Change the values relevent to the rp of origin
   *
   * @param rpSplit is the probability ratio of messages to come from the 3 mock rps
   */
  public async adjustRpOfOrigin(rpSplit: Array<number>): Promise<void> {
    const MockRPsKeys: Array<keyof typeof MockRPs> = Object.keys(
      MockRPs
    ) as unknown as Array<keyof typeof MockRPs>;

    const chosenRP: keyof typeof MockRPs = await this.weightedChoiceFromArray<
      keyof typeof MockRPs
    >(MockRPsKeys, rpSplit);

    this.mockSET.iss = MockRPs[chosenRP].publicKeyURL;

    const userPairwiseIDs = MockRPs[chosenRP].userPairwiseIDs;
    const userPairwiseIDsKeys: Array<string> = Object.keys(userPairwiseIDs);
    const chosenUser = userPairwiseIDsKeys[
      Math.floor(Math.random() * userPairwiseIDsKeys.length)
    ] as keyof typeof userPairwiseIDs;

    this.mockSET.sub = userPairwiseIDs[chosenUser];
  }

  /**
   * Change the event field
   *
   * @param eventSplit is the probability ratio of events types to be sent
   */
  public async adjustEvent(eventSplit: Array<number>): Promise<void> {
    const chosenEventType: EventTypes =
      await this.weightedChoiceFromArray<EventTypes>(
        validEventKeys,
        eventSplit
      );

    const eventObject: BaseEvent = EventMapping[chosenEventType](
      this.mockSET as JsonMockSET
    );

    this.mockSET.events = await eventObject.constructEvent();
  }

  /**
   * Potentially error one of the fields by making it undefined
   *
   * @param eventSplit is the probability that one of the SET values will get errored
   */
  public async addError(errorChance: number): Promise<void> {
    const causeError: boolean = await this.weightedChoiceFromArray<boolean>(
      [true, false],
      [errorChance, 1 - errorChance]
    );

    if (!causeError) {
      return;
    }

    const setFields: Array<string> = [
      'iss',
      'iat',
      'jti',
      'aud',
      'sub',
      'txn',
      'toe',
      'events',
    ];
    const fieldToError: string =
      setFields[Math.floor(Math.random() * setFields.length)];

    // Switch case used as more varied errors are likely to be wanted in the future past making the whole field undefined
    switch (fieldToError) {
      case 'iss': {
        this.mockSET.iss = undefined;
        break;
      }
      case 'iat': {
        this.mockSET.iat = undefined;
        break;
      }
      case 'jti': {
        this.mockSET.jti = undefined;
        break;
      }
      case 'aud': {
        this.mockSET.aud = undefined;
        break;
      }
      case 'sub': {
        this.mockSET.sub = undefined;
        break;
      }
      case 'txn': {
        this.mockSET.txn = undefined;
        break;
      }
      case 'toe': {
        this.mockSET.toe = undefined;
        break;
      }
      case 'events': {
        this.mockSET.events = undefined;
        break;
      }
    }
  }

  /**
   * Given an array of choices, and probability weights, return on of the choices.
   * Constructs an 100 length array with each choice repeated accordinging to its weight, then picks one element at random.
   *
   * @param array is the array of choices to be picked
   * @param weights is the corresponsing array of probabilities that the related choice will be picked
   */
  public async weightedChoiceFromArray<ArrayType>(
    array: Array<ArrayType>,
    weights: Array<number>
  ): Promise<ArrayType> {
    weights = weights.map((weight) => Math.round(weight * 10));
    const sum: number = weights.reduce(
      (sum, currentValue) => sum + currentValue,
      0
    );
    let indexCounter: number = 0;
    let choiceArray: Array<any> = Array(sum);
    for (let i = 0; i < weights.length; i++) {
      choiceArray.fill(array[i], indexCounter, indexCounter + weights[i]);
      indexCounter += weights[i];
    }
    const randomElement: ArrayType =
      choiceArray[Math.floor(Math.random() * choiceArray.length)];
    return randomElement;
  }
}