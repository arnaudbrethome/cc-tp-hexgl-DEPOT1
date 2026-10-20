/* Tests du code existant HexGL, sans Node.js. QUnit est chargé localement. */
(function () {
  "use strict";
  if (typeof QUnit === "undefined") {
    document.documentElement.dataset.testStatus = "fail";
    document.documentElement.dataset.testCount = "0";
    document.documentElement.dataset.testFailures = "1";
    document.body.insertAdjacentHTML("afterbegin", "<p style='color:red'>QUnit introuvable : vérifiez le fichier vendor/qunit-2.26.0.js</p>");
    return;
  }

  // Compatible avec le script Chrome headless existant : état mesurable dans le DOM.
  QUnit.done(function (result) {
    const count = result.total;
    const failed = result.failed;
    const root = document.documentElement;
    root.setAttribute("data-test-count", String(count));
    root.setAttribute("data-test-failures", String(failed));
    root.setAttribute("data-test-status", failed === 0 && count >= 4 ? "pass" : "fail");
    let summary = document.getElementById("summary");
    if (!summary) {
      summary = document.createElement("p");
      summary.id = "summary";
      document.body.appendChild(summary);
    }
    summary.textContent = count + " test(s) : " + (count - failed) + " réussi(s), " + failed + " échec(s).";
  });

  const U = window.bkcore && window.bkcore.Utils;
  QUnit.module("HexGL — bkcore.Utils", function () {
    QUnit.test("updateClass ajoute une classe", function (assert) {
      assert.ok(U, "Utils.js chargé");
      const e = document.createElement("div");
      e.id = "test-hexgl-add";
      document.getElementById("qunit-fixture").appendChild(e);
      U.updateClass(e.id, "active", true);
      assert.true(e.classList.contains("active"));
    });
    QUnit.test("updateClass supprime une classe", function (assert) {
      assert.ok(U, "Utils.js chargé");
      const e = document.createElement("div");
      e.id = "test-hexgl-remove";
      e.className = "active";
      document.getElementById("qunit-fixture").appendChild(e);
      U.updateClass(e.id, "active", false);
      assert.false(e.classList.contains("active"));
    });
    QUnit.test("getOffsetTop additionne les décalages parent/enfant", function (assert) {
      const parent = {
        offsetTop: 37,
        offsetParent: null
      };
      const enfant = {
        offsetTop: 13,
        offsetParent: parent
      };
      assert.strictEqual(U.getOffsetTop(enfant), 50);
    });
    QUnit.test("getURLParameter lit les paramètres d'URL", function (assert) {
      assert.ok(U, "Utils.js chargé");
      U.URLParameters = null;
      const url = new URL(window.location.href);
      url.searchParams.set("hexgl_poc", "ok");
      // Le lanceur fournit hexgl_poc=ok ; en ouverture directe, on teste l'absence ou la présence.
      const expected = window.location.search.includes("hexgl_poc=ok") ? "ok" : null;
      assert.strictEqual(U.getURLParameter("hexgl_poc"), expected);
    });
  });

  // Ces tests protègent le formatage des temps de course (affiché en HUD,
  // écran de score et classement) avant tout refactoring de HexGL.js/Gameplay.js.
  const T = window.bkcore && window.bkcore.Timer;
  QUnit.module("HexGL — bkcore.Timer", function () {
    QUnit.test("msToTime découpe les millisecondes en h/m/s/ms", function (assert) {
      assert.ok(T, "Timer.js chargé");
      // 1h 2min 3s 456ms = 3600000 + 120000 + 3000 + 456
      const t = T.msToTime(3600000 + 120000 + 3000 + 456);
      assert.strictEqual(t.h, 1);
      assert.strictEqual(t.m, 2);
      assert.strictEqual(t.s, 3);
      assert.strictEqual(t.ms, 456);
    });
    QUnit.test("msToTime gère zéro et les bornes de minute/heure", function (assert) {
      assert.deepEqual(T.msToTime(0), { h: 0, m: 0, s: 0, ms: 0 });
      // 59999ms = 0h 0m 59s 999ms (ne doit pas basculer sur la minute suivante)
      const t = T.msToTime(59999);
      assert.strictEqual(t.m, 0);
      assert.strictEqual(t.s, 59);
      assert.strictEqual(t.ms, 999);
    });
    QUnit.test("msToTimeString ajoute des zéros de remplissage", function (assert) {
      // 65010ms = 0h 1m 5s 10ms -> affichage attendu "00"/"01"/"05"/"0010"
      const t = T.msToTimeString(65010);
      assert.strictEqual(t.h, "00");
      assert.strictEqual(t.m, "01");
      assert.strictEqual(t.s, "05");
      assert.strictEqual(t.ms, "0010");
    });
    QUnit.test("zfill ne tronque pas un nombre déjà assez long", function (assert) {
      assert.strictEqual(T.zfill(5, 2), "05");
      assert.strictEqual(T.zfill(123, 2), "123");
      assert.strictEqual(T.zfill(0, 3), "000");
    });
  });
})();
