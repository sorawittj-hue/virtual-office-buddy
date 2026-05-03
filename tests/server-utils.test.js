import assert from "node:assert/strict";
import { Readable } from "node:stream";
import {
  HttpError,
  escapeTelegramHtml,
  getCorsOrigin,
  readJsonBody,
  simulatedResult,
} from "../server-utils.js";

{
  const origins = ["http://localhost:3000", "http://127.0.0.1:5173"];
  assert.equal(getCorsOrigin("http://localhost:3000", origins), "http://localhost:3000");
  assert.equal(getCorsOrigin("https://example.com", origins), null);
  assert.equal(getCorsOrigin("https://example.com", ["*"]), "*");
}

{
  const req = Readable.from([Buffer.from("{bad")]);
  await assert.rejects(readJsonBody(req, 100), (err) => {
    assert.ok(err instanceof HttpError);
    assert.equal(err.status, 400);
    return true;
  });
}

{
  const req = Readable.from([Buffer.from('{"message":"too long"}')]);
  await assert.rejects(readJsonBody(req, 10), (err) => {
    assert.ok(err instanceof HttpError);
    assert.equal(err.status, 413);
    return true;
  });
}

{
  assert.equal(escapeTelegramHtml('<b>"A&B"</b>'), "&lt;b&gt;&quot;A&amp;B&quot;&lt;/b&gt;");
}

{
  assert.match(simulatedResult("email sent"), /^Simulated only:/);
}

console.log("server-utils tests passed");
