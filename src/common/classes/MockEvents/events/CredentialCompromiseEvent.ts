import { EventTypes } from "../../../enums/eventsEnums";
import { JsonMockSET } from "../../../interfaces/interfaces";
import { BaseEvent } from "./BaseEvent";

export class CredentialCompromiseEvent extends BaseEvent {
  constructor(mockSet: JsonMockSET) {
    super(EventTypes.CredentialCompromise, mockSet);
  }

  /**
   * Constructs the JSON for the SET event field based off current values
   *
   * @returns the event Json
   */
  public async constructEvent() {
    const credentialTypes: string[] = [
      "password",
      "pin",
      "x509",
      "fido2-platform",
      "fido2-roaming",
      "fido-u2f",
      "verifiable-credential",
      "phone-voice",
      "phone-sms",
      "app",
    ];
    const chosenCredentialType: string =
      credentialTypes[Math.floor(Math.random() * credentialTypes.length)];

    return {
      [this.eventURI]: {
        subject: {
          subject_type: "iss_sub",
          iss: this.iss,
          sub: this.sub,
        },
        credential_type: chosenCredentialType,
        event_timestamp: this.toe,
        reason_admin: "Admin reason",
        reason_user: "User reason",
      },
    };
  }
}
