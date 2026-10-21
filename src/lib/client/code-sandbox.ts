export type SandboxTestResult = {
  name: string;
  pass: boolean;
  error: string | null;
  expected: unknown;
  actual: unknown;
};

export type SandboxRunResult = {
  results: SandboxTestResult[];
  error?: string;
  logs?: string[];
};

const WORKER_SOURCE = `
self.onmessage = function (event) {
  var config = event.data || {};
  var tests = Array.isArray(config.tests) ? config.tests : [];
  var results = [];
  var logs = [];
  function fmt(value) {
    try {
      if (typeof value === "string") return value;
      if (typeof value === "undefined") return "undefined";
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }
  var consoleProxy = {
    log: function () { logs.push(Array.prototype.map.call(arguments, fmt).join(" ")); },
    warn: function () { logs.push(Array.prototype.map.call(arguments, fmt).join(" ")); },
    error: function () { logs.push(Array.prototype.map.call(arguments, fmt).join(" ")); }
  };
  try {
    var factory = new Function(
      "console",
      '"use strict";\\n' + config.code + '\\n; return typeof ' + config.functionName +
        ' === "function" ? ' + config.functionName + ' : undefined;'
    );
    var fn = factory(consoleProxy);
    if (!fn) {
      self.postMessage({ error: "未找到函数 " + config.functionName + "，请保留函数声明", results: [], logs: logs });
      return;
    }
    for (var i = 0; i < tests.length; i += 1) {
      var test = tests[i];
      try {
        var value = fn.apply(null, test.args || []);
        if (value && typeof value.then === "function") {
          self.postMessage({ error: "当前判题只支持同步函数，请返回同步结果", results: [], logs: logs });
          return;
        }
        results.push({
          name: test.name,
          pass: deepEqual(value, test.expected),
          error: null,
          expected: test.expected,
          actual: value
        });
      } catch (error) {
        results.push({
          name: test.name,
          pass: false,
          error: String(error && error.message ? error.message : error),
          expected: test.expected,
          actual: null
        });
      }
    }
    self.postMessage({ results: results, logs: logs });
  } catch (error) {
    self.postMessage({ error: String(error && error.message ? error.message : error), results: [], logs: logs });
  }
};

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number" && isNaN(a) && isNaN(b)) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  var aArray = Array.isArray(a);
  var bArray = Array.isArray(b);
  if (aArray !== bArray) return false;
  if (aArray) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i += 1) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  var aKeys = Object.keys(a);
  var bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (var j = 0; j < aKeys.length; j += 1) {
    if (!Object.prototype.hasOwnProperty.call(b, aKeys[j])) return false;
    if (!deepEqual(a[aKeys[j]], b[aKeys[j]])) return false;
  }
  return true;
}
`;

const IFRAME_SOURCE = `<!DOCTYPE html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; img-src data:;">
</head><body>
<script>
var worker = null;
window.addEventListener('message', function (event) {
  if (!event.data || event.data.type !== 'run') return;
  try {
    if (worker) { worker.terminate(); worker = null; }
    worker = new Worker(URL.createObjectURL(new Blob([${JSON.stringify(WORKER_SOURCE)}], { type: 'text/javascript' })));
    worker.onmessage = function (messageEvent) {
      parent.postMessage({ type: 'offerpath-code-result', payload: messageEvent.data }, '*');
    };
    worker.onerror = function (errorEvent) {
      parent.postMessage({
        type: 'offerpath-code-result',
        payload: { error: String(errorEvent.message || '代码执行失败'), results: [], logs: [] }
      }, '*');
    };
    worker.postMessage(event.data.payload);
  } catch (error) {
    parent.postMessage({
      type: 'offerpath-code-result',
      payload: { error: String(error && error.message ? error.message : error), results: [], logs: [] }
    }, '*');
  }
});
</script>
</body></html>`;

export function runJavaScriptTests(input: {
  code: string;
  functionName: string;
  tests: Array<{ name: string; args: unknown[]; expected: unknown }>;
  timeoutMs?: number;
}): Promise<SandboxRunResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ results: [], error: "判题环境不可用" });
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.display = "none";
    iframe.srcdoc = IFRAME_SOURCE;

    let settled = false;
    const timeout = window.setTimeout(() => {
      finish({ results: [], error: "运行超时：请检查是否存在死循环或过重计算" });
    }, input.timeoutMs ?? 3500);

    function finish(result: SandboxRunResult) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data as { type?: string; payload?: SandboxRunResult } | null;
      if (!data || data.type !== "offerpath-code-result") return;
      finish(
        data.payload ?? { results: [], error: "判题返回格式异常" },
      );
    }

    window.addEventListener("message", onMessage);
    iframe.onload = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "run",
          payload: {
            code: input.code,
            functionName: input.functionName,
            tests: input.tests,
          },
        },
        "*",
      );
    };
    document.body.appendChild(iframe);
  });
}
