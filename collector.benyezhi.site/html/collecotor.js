const DEBUG = true;
(function () {
    const ENDPOINT_URL = "https://collector.benyezhi.site/log";
    const enterTime = new Date().toISOString();

    // Session
    function getSessionId() {
        let sid = sessionStorage.getItem("collector_session_id");
        if (!sid) {
            sid = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now();
            sessionStorage.setItem("collector_session_id", sid);
        }
        return sid;
    }
    const sessionId = getSessionId();

    // sendBeacon first, if it does work then `fetch`
    function sendPayload(type, data) {
        const payload = {
            sessionId: sessionId,
            type: type,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            data: data,
        };

        if (DEBUG) {
            console.groupCollapsed(`%c[Analytics Debug] %c${type}`, "color: #999;", "color: #007acc; font-weight: bold;");
            console.log("Payload:", payload);
            console.log("data:", data);
            console.groupEnd();
            return;
        }

        const jsonString = JSON.stringify(payload);
        if (navigator.sendBeacon) {
            const blob = new Blob([jsonString], { type: "application/json" });
            navigator.sendBeacon(ENDPOINT_URL, blob);
        } else {
            fetch(ENDPOINT_URL, {
                method: "POST",
                body: jsonString,
                headers: { "Content-Type": "application/json" },
                keepalive: true,
            }).catch(() => { });
        }
    }


    function testCSS() {
        const testEl = document.createElement("div");
        testEl.style.display = "none";
        document.head.appendChild(testEl);
        const isSupported = window.getComputedStyle(testEl).display === "none";
        document.head.removeChild(testEl);
        return isSupported;
    }

    function testImages() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.width > 0 && img.height > 0);
            img.onerror = () => resolve(false)
            img.src =
                "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        });
    }



    window.addEventListener("load", function () {
        setTimeout(async function () {
            const imagesAllowed = await testImages()
            // Static Data
            const staticData = {
                userAgent: navigator.userAgent,
                language: navigator.language || navigator.userLanguage,
                cookiesAllowed: navigator.cookieEnabled,
                javascriptAllowed: true,
                imagesAllowed: imagesAllowed,
                cssAllowed: testCSS(),
                screenDimensions: {
                    width: window.screen.width,
                    height: window.screen.height,
                    availWidth: window.screen.availWidth,
                    availHeight: window.screen.availHeight,
                },
                windowDimensions: {
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight,
                    outerWidth: window.outerWidth,
                    outerHeight: window.outerHeight,
                },
                networkConnection: navigator.connection
                    ? {
                        effectiveType: navigator.connection.effectiveType,
                        downlink: navigator.connection.downlink,
                        rtt: navigator.connection.rtt,
                        saveData: navigator.connection.saveData,
                    }
                    : "unsupported",
            };
            sendPayload("static", staticData);

            // Performance data
            const perfEntries = performance.getEntriesByType("navigation");
            let timingObj = {};
            let startLoad = 0;
            let endLoad = 0;
            let totalLoadTime = 0;

            if (perfEntries && perfEntries.length > 0) {
                const nav = perfEntries[0];
                timingObj = nav.toJSON();
                startLoad = nav.startTime;
                endLoad = nav.loadEventEnd;
                totalLoadTime = Math.round(nav.duration || endLoad - startLoad);
            } else if (performance.timing) {
                timingObj = performance.timing;
                startLoad = performance.timing.navigationStart;
                endLoad = performance.timing.loadEventEnd;
                totalLoadTime = endLoad - startLoad;
            }

            const performanceData = {
                timingObject: timingObj,
                pageLoadStart: startLoad,
                pageLoadEnd: endLoad,
                totalLoadTimeMs: totalLoadTime,
            };
            sendPayload("performance", performanceData);
        }, 0);
    });

    window.onerror = function (message, source, lineno, colno, error) {
        sendPayload("error", {
            message: message,
            source: source,
            lineno: lineno,
            colno: colno,
            stack: error ? error.stack : null,
        });
        return false;
    };

    let activityQueue = [];
    let lastActiveTimestamp = Date.now();
    let idleTimer = null;

    function flushActivity() {
        if (activityQueue.length > 0) {
            sendPayload("activity_batch", activityQueue);
            activityQueue = [];
        }
    }

    setInterval(flushActivity, 3000);

    function recordActivity() {
        const now = Date.now();
        const idleDuration = now - lastActiveTimestamp;
        if (idleDuration >= 2000) {
            sendPayload("idle", {
                breakEndedAt: new Date(now).toISOString(),
                idleDurationMs: idleDuration,
            });
        }
        lastActiveTimestamp = now;
    }

    let lastMove = 0;
    window.addEventListener("mousemove", function (e) {
        recordActivity();
        const now = Date.now();
        if (now - lastMove > 200) {
            activityQueue.push({
                event: "mousemove",
                x: e.clientX,
                y: e.clientY,
                timestamp: now,
            });
            lastMove = now;
        }
    });

    window.addEventListener("click", function (e) {
        recordActivity();
        activityQueue.push({
            event: "click",
            button: e.button, // 0: left, 1: middle, 2: right
            x: e.clientX,
            y: e.clientY,
            targetTag: e.target ? e.target.tagName : null,
            timestamp: Date.now(),
        });
    });

    let lastScroll = 0;
    window.addEventListener("scroll", function () {
        recordActivity();
        const now = Date.now();
        if (now - lastScroll > 250) {
            activityQueue.push({
                event: "scroll",
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                timestamp: now,
            });
            lastScroll = now;
        }
    });

    window.addEventListener("keydown", function (e) {
        recordActivity();
        activityQueue.push({
            event: "keydown",
            key: e.key,
            code: e.code,
            timestamp: Date.now(),
        });
    });

    window.addEventListener("keyup", function (e) {
        recordActivity();
        activityQueue.push({
            event: "keyup",
            key: e.key,
            code: e.code,
            timestamp: Date.now(),
        });
    });

    window.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
            flushActivity();
            sendPayload("page_exit", {
                enterTime: enterTime,
                exitTime: new Date().toISOString(),
                url: window.location.href,
            });
        }
    });

    window.addEventListener("beforeunload", function () {
        flushActivity();
        sendPayload("page_exit", {
            enterTime: enterTime,
            exitTime: new Date().toISOString(),
            url: window.location.href,
        });
    });
})();