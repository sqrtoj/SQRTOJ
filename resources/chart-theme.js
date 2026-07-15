// Theme Chart.js (v2) from the design-system CSS tokens so every chart on the
// site (OJ stats, contest stats, org usage, submission status pie, rating
// history) adapts to the active palette + light/dark theme instead of relying
// on Chart.js's hardcoded light-theme defaults.
//
// Loaded once right after Chart.js on each page that renders charts. Reads the
// live values of --color-text, --color-text-muted, and --color-border off
// :root so it stays correct for warm/summer and light/dark without duplicating
// any color values here.
(function () {
    'use strict';
    if (typeof Chart === 'undefined' || !Chart.defaults) {
        return;
    }

    var root = getComputedStyle(document.documentElement);
    function token(name, fallback) {
        var value = root.getPropertyValue(name);
        return (value && value.trim()) || fallback;
    }

    var textColor = token('--color-text', '#2e241c');
    var mutedColor = token('--color-text-muted', '#8a7360');
    var borderColor = token('--color-border', '#e4d5c1');
    var surfaceColor = token('--color-surface-raised', '#ffffff');

    // Global text (legend labels, tooltips, etc.).
    Chart.defaults.global.defaultFontColor = textColor;
    Chart.defaults.global.defaultFontFamily =
        token('--font-ui', '"Inter", "Segoe UI", Arial, sans-serif');

    if (Chart.defaults.global.legend && Chart.defaults.global.legend.labels) {
        Chart.defaults.global.legend.labels.fontColor = textColor;
    }

    // Tooltips: use surface/border/text tokens so they read on both themes.
    if (Chart.defaults.global.tooltips) {
        var tip = Chart.defaults.global.tooltips;
        tip.backgroundColor = surfaceColor;
        tip.titleFontColor = textColor;
        tip.bodyFontColor = textColor;
        tip.footerFontColor = mutedColor;
        tip.borderColor = borderColor;
        tip.borderWidth = 1;
    }

    // Axis ticks + gridlines. Chart.js v2 keeps per-scale-type defaults; set the
    // common scale defaults plus each registered scale type we use.
    function themeScale(scaleDefaults) {
        if (!scaleDefaults) {
            return;
        }
        if (scaleDefaults.ticks) {
            scaleDefaults.ticks.fontColor = mutedColor;
        }
        if (scaleDefaults.gridLines) {
            scaleDefaults.gridLines.color = borderColor;
            scaleDefaults.gridLines.zeroLineColor = borderColor;
        }
        if (scaleDefaults.scaleLabel) {
            scaleDefaults.scaleLabel.fontColor = textColor;
        }
    }

    if (Chart.defaults.scale) {
        themeScale(Chart.defaults.scale);
    }
    ['category', 'linear', 'logarithmic', 'time', 'radialLinear'].forEach(function (type) {
        themeScale(Chart.defaults[type]);
    });
})();
