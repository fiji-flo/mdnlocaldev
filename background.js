const MDN_TEST_HOST = "developer.allizom.org";
const MDN_PROD_HOST = "developer.mozilla.org";
const MDN_HOST_NAMES = [MDN_TEST_HOST, MDN_PROD_HOST];
const MDN_TEST_PATTERN = `https://${MDN_TEST_HOST}/*`;
const MDN_PROD_PATTERN = `https://${MDN_PROD_HOST}/*`;
const MDN_PATTERN = [MDN_TEST_PATTERN, MDN_PROD_PATTERN];
const FRONT_END_PATTERN =
  /https:\/\/developer\.(allizom|mozilla)\.org\/static\/(.*.js|css|img).*/;
const INDEX_PATTERN = /https:\/\/developer\.(allizom|mozilla)\.org\/[^.]*$/;
const EXCLUDE_LIST = [
  "content-security-policy",
  "x-content-type-options",
  "strict-transport-security",
  "x-xss-protection",
];

const index = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!--
      Note that our build process will rewrite this 'href' value to a copy
      of the file that has a hash in it.
    -->

    <link rel="icon" href="/favicon-48x48.png" />

    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <meta name="theme-color" content="#ffffff" />

    <link rel="manifest" href="/manifest.json" />

    <link
      rel="search"
      type="application/opensearchdescription+xml"
      href="/opensearch.xml"
      title="MDN Web Docs"
    />

    <title>MDN Web Docs</title>
    <link rel="canonical" href="https://developer.mozilla.org" />
    <style media="print">
      .breadcrumbs-container,
      .language-toggle,
      .document-toc-container,
      .on-github,
      nav.sidebar,
      .top-navigation-main,
      .page-footer,
      ul.prev-next,
      .language-menu {
        display: none !important;
      }
      .main-page-content,
      .main-page-content pre {
        padding: 2px;
      }
      .main-page-content pre {
        border-left-width: 2px;
      }
    </style>
  </head>
  <body>
    <script>
      const c = { light: "#ffffff", dark: "#15141a" };
      if (window && document.body) {
        const o = window.localStorage.getItem("theme");
        o &&
          ((document.body.className = o),
          (document.body.style.backgroundColor = c[o]));
      }
    </script>
    <div id="root"></div>
    <script src="/static/js/bundle.js"></script>
    <script src="/static/js/vendors~main.chunk.js"></script>
    <script src="/static/js/main.chunk.js"></script>
  </body>
</html>`;

let enabled = false;

async function redirect(e) {
  if (e.url.match(FRONT_END_PATTERN)) {
    const url = new URL(e.url);
    url.hostname = "localhost";
    url.port = 3000;
    console.log(`Redirecting: ${e.url} → ${url.toString()}`);

    return { redirectUrl: url.toString() };
  }
}

async function unsecure(e) {
  const url = new URL(e.url);
  if (MDN_HOST_NAMES.includes(url.hostname)) {
    const h = e.responseHeaders;
    const orgCsp = h.find((h) => h.name === "content-security-policy");
    if (orgCsp) {
      const filtered = h.filter((h) => !EXCLUDE_LIST.includes(h.name));
      return { responseHeaders: filtered };
    }
  }
}

async function hackIndex(e) {
  const url = new URL(e.url);
  if (e.url.match(INDEX_PATTERN) && !url.pathname.match(/\/(api|users)\/.*/)) {
    if (e.type === "main_frame") {
      const filter = browser.webRequest.filterResponseData(e.requestId);
      const encoder = new TextEncoder("utf-8");
      console.log("replacing index");
      let done = false;

      filter.ondata = () => {
        if (!done) {
          done = true;
          filter.write(encoder.encode(index));
        }
      };
      filter.onstop = () => {
        filter.close();
      };
    }
  }
}

function enable() {
  enabled = true;
  browser.browserAction.setIcon({ path: { 64: "icons/icon.svg" } });
  browser.webRequest.onBeforeRequest.addListener(
    hackIndex,
    { urls: MDN_PATTERN },
    ["blocking"]
  );

  browser.webRequest.onBeforeRequest.addListener(
    redirect,
    { urls: MDN_PATTERN },
    ["blocking"]
  );

  browser.webRequest.onHeadersReceived.addListener(
    unsecure,
    { urls: MDN_PATTERN },
    ["blocking", "responseHeaders"]
  );
  console.log("enabled");
}

function disable() {
  browser.webRequest.onBeforeRequest.removeListener(hackIndex);

  browser.webRequest.onBeforeRequest.removeListener(redirect);

  browser.webRequest.onHeadersReceived.removeListener(unsecure);
  enabled = false;
  browser.browserAction.setIcon({ path: { 64: "icons/icon-grey.svg" } });
  console.log("disabled");
}

browser.browserAction.onClicked.addListener(() => {
  console.log("DOOM");
  if (!enabled) {
    enable();
  } else {
    disable();
  }
});
