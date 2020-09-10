const Assert = require("assert");
const http = require("http");
const { withServer, checkServerLogs, PORT, STOP } = require("./utils");

describe("Top Sites forward request endpoint", function() {
  it("should handle proper requests to /cid/:cid properly", async function() {
    return withServer(async server => {
      const cid = "amzn_2020_1";
      const logsPromise = checkServerLogs(server, [`forwarding ${cid} to `]);

      let res = await new Promise(resolve => http.get(`http://localhost:${PORT}/cid/${cid}`, resolve));
      Assert.equal(res.statusCode, 200);

      let data = await new Promise(resolve => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", chunk => rawData += chunk);
        res.on("end", () => {
          resolve(rawData);
        });
      });
      await logsPromise;

      Assert.ok(data);
      Assert.equal(data.trim(), `TEST: /test?key=xxx&cuid=${cid}&h1=&h2=`);
    });
  });

  it("should handle proper requests to /cid/:cid properly WITH headers", async function() {
    return withServer(async server => {
      const cid = "amzn_2020_1";
      const logsPromise = checkServerLogs(server, [`forwarding ${cid} to `]);

      let res = await new Promise(resolve => http.get(`http://localhost:${PORT}/cid/${cid}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:80.0) Gecko/20100101 Firefox/80.0",
          "X-Region": "us",
          "X-Source": "newtab"
        }
      }, resolve));
      Assert.equal(res.statusCode, 200);

      let data = await new Promise(resolve => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", chunk => rawData += chunk);
        res.on("end", () => {
          resolve(rawData);
        });
      });
      await logsPromise;

      let [query, userAgent, statusCode] = data.split("\n");
      Assert.ok(query);
      Assert.equal(query.trim(), `TEST: /test?key=xxx&cuid=${cid}&h1=us&h2=newtab`);
      // Header should be pruned of unnecessary PII data:
      Assert.equal(userAgent.trim(), "Mozilla/5.0 (Macintosh; rv:80.0) Gecko/20100101 Firefox/80.0");
    });
  });
});