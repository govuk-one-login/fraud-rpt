import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { publicKeyLambda } from "./handler";
import { KeyManager } from "../../common/classes/keys/keys";
import { LogEvents } from "../../common/enums/Log-events";
import { KeyObject } from "crypto";
import { ssmParams } from "../../common/classes/SSM/SSMParams";

test("placeholder", () => {
  expect(2 + 2).toBe(4);
});
