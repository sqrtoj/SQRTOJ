/*
 * Martor markdown editor for SQRTOJ.
 * Upstream: https://github.com/agusmakmun/django-markdown-editor (GPL-3.0)
 */

(function ($) {
  "use strict";

  if (!$) {
    $ =
      typeof window !== "undefined" && window.django && window.django.jQuery
        ? window.django.jQuery
        : typeof window !== "undefined" && window.jQuery
        ? window.jQuery
        : typeof jQuery !== "undefined"
        ? jQuery
        : null;
  }

  if (!$) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[Martor] jQuery is not loaded. Martor initialization skipped.");
    }
    return;
  }

  const Martor = window.Martor || {
    version: "1.4.9-sqrtoj",
    debug: false,
    instances: {},

    get(fieldName) {
      return this.instances[fieldName] || null;
    },

    getAll() {
      return Object.values(this.instances);
    },

    refreshAll() {
      this.getAll().forEach((instance) => instance.refreshPreview());
    },
  };
  window.Martor = Martor;

  const MartorLogger = {
    _log(level, fieldName, message, extra) {
      if (level === "debug" && !Martor.debug) {
        return;
      }
      const prefix = `[Martor${fieldName ? ":" + fieldName : ""}]`;
      const logFn = console[level] || console.log;
      if (extra !== undefined) {
        logFn(prefix, message, extra);
      } else {
        logFn(prefix, message);
      }
    },
    debug(fieldName, msg, extra) {
      this._log("debug", fieldName, msg, extra);
    },
    info(fieldName, msg, extra) {
      this._log("info", fieldName, msg, extra);
    },
    warn(fieldName, msg, extra) {
      this._log("warn", fieldName, msg, extra);
    },
    error(fieldName, msg, extra) {
      this._log("error", fieldName, msg, extra);
    },
  };

  const CookieHelper = {
    getCookie(name) {
      if (!document.cookie) {
        return null;
      }
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
          return decodeURIComponent(cookie.substring(name.length + 1));
        }
      }
      return null;
    },
    getCsrfToken() {
      return this.getCookie("csrftoken") || "";
    },
  };

  const ThemeManager = {
    getThemePreference() {
      const theme = (
        $("body").attr("data-theme") ||
        $("html").attr("data-theme") ||
        ""
      ).toLowerCase();
      return ["dark", "light", "auto"].includes(theme) ? theme : "";
    },

    hasDarkStylesheet() {
      const links = document.querySelectorAll('link[rel="stylesheet"][href]');
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (
          href.indexOf("/dark/style") === -1 &&
          href.indexOf("dark/style") === -1 &&
          href.indexOf("/dark/") === -1
        ) {
          continue;
        }
        const media = link.media || "";
        if (!media || !window.matchMedia || window.matchMedia(media).matches) {
          return true;
        }
      }
      return false;
    },

    isDarkMode() {
      const preference = this.getThemePreference();
      if (preference === "dark") {
        return true;
      }
      if (preference === "light") {
        return false;
      }
      if (this.hasDarkStylesheet()) {
        return true;
      }
      if (typeof window !== "undefined" && window.getComputedStyle) {
        const root = window.getComputedStyle(document.documentElement);
        const canvas = (root.getPropertyValue("--color-canvas") || "").trim().toLowerCase();
        if (
          canvas === "#140f0a" ||
          canvas === "#222222" ||
          canvas === "#111111" ||
          canvas === "#211812"
        ) {
          return true;
        }
        const text = (root.getPropertyValue("--color-text") || "").trim().toLowerCase();
        if (text === "#f4ebdd" || text === "#f8f8f8") {
          return true;
        }
      }
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    },

    applyTheme($container, editor) {
      if (this.isDarkMode()) {
        $container.addClass("martor-theme-dark");
        $container.find(".ui").removeClass("inverted");
        editor.setTheme("ace/theme/twilight");
      } else {
        $container.removeClass("martor-theme-dark");
        $container.find(".ui").removeClass("inverted");
        editor.setTheme("ace/theme/github");
      }
    },

    bindAutoThemeListener(callback) {
      if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", callback);
      }
    },
  };

  const ConfigParser = {
    parse($textarea) {
      const defaults = {
        imgur: "true",
        mention: "false",
        living: "false",
        hljs: "true",
      };
      const rawConfig = $textarea.data("enable-configs");
      if (!rawConfig) {
        return defaults;
      }
      if (typeof rawConfig === "object") {
        return { ...defaults, ...rawConfig };
      }
      try {
        const parsed = JSON.parse(String(rawConfig).replace(/'/g, '"'));
        return { ...defaults, ...parsed };
      } catch (error) {
        MartorLogger.warn("", "Failed to parse data-enable-configs JSON, using defaults:", error);
        return defaults;
      }
    },
  };

  const MarkdownFormatter = {
    wrapInline(editor, { emptyText, emptyCursorColOffset, openTag, closeTag }) {
      const originalRange = editor.getSelectionRange();
      if (editor.selection.isEmpty()) {
        const curpos = editor.getCursorPosition();
        editor.session.insert(curpos, emptyText);
        editor.focus();
        editor.selection.moveTo(curpos.row, curpos.column + emptyCursorColOffset);
      } else {
        const selectedText = editor.session.getTextRange(originalRange);
        editor.session.replace(originalRange, openTag + selectedText + closeTag);
        originalRange.end.column += openTag.length + closeTag.length;
        editor.focus();
        editor.selection.setSelectionRange(originalRange);
      }
    },

    insertBlock(editor, { emptyText, emptyCursorOffset, wrapText, moveCursorOffset }) {
      const originalRange = editor.getSelectionRange();
      if (editor.selection.isEmpty()) {
        const curpos = editor.getCursorPosition();
        editor.session.insert(curpos, emptyText);
        editor.focus();
        editor.selection.moveTo(
          curpos.row + emptyCursorOffset.row,
          curpos.column + emptyCursorOffset.col,
        );
      } else {
        const selectedText = editor.session.getTextRange(originalRange);
        editor.session.replace(originalRange, wrapText(selectedText));
        editor.focus();
        editor.selection.moveTo(
          originalRange.end.row + moveCursorOffset.row,
          originalRange.end.column + moveCursorOffset.col,
        );
      }
    },

    bold(editor) {
      this.wrapInline(editor, {
        emptyText: " **** ",
        emptyCursorColOffset: 3,
        openTag: "**",
        closeTag: "**",
      });
    },

    italic(editor) {
      this.wrapInline(editor, {
        emptyText: " ** ",
        emptyCursorColOffset: 2,
        openTag: "*",
        closeTag: "*",
      });
    },

    strikethrough(editor) {
      this.wrapInline(editor, {
        emptyText: " ~~~~ ",
        emptyCursorColOffset: 3,
        openTag: "~~",
        closeTag: "~~",
      });
    },

    code(editor) {
      this.wrapInline(editor, {
        emptyText: " `` ",
        emptyCursorColOffset: 2,
        openTag: "`",
        closeTag: "`",
      });
    },

    inlineMath(editor) {
      this.wrapInline(editor, {
        emptyText: "~~",
        emptyCursorColOffset: 1,
        openTag: "~",
        closeTag: "~",
      });
    },

    displayMath(editor) {
      this.wrapInline(editor, {
        emptyText: "$$$$",
        emptyCursorColOffset: 2,
        openTag: "$$",
        closeTag: "$$",
      });
    },

    horizontal(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n----------\n\n",
        emptyCursorOffset: { row: 4, col: 10 },
        wrapText: (text) => "\n\n----------\n\n" + text,
        moveCursorOffset: { row: 4, col: 10 },
      });
    },

    h1(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n# ",
        emptyCursorOffset: { row: 2, col: 2 },
        wrapText: (text) => "\n\n# " + text + "\n",
        moveCursorOffset: { row: 2, col: 2 },
      });
    },

    h2(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n## ",
        emptyCursorOffset: { row: 2, col: 3 },
        wrapText: (text) => "\n\n## " + text + "\n",
        moveCursorOffset: { row: 2, col: 3 },
      });
    },

    h3(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n### ",
        emptyCursorOffset: { row: 2, col: 4 },
        wrapText: (text) => "\n\n### " + text + "\n",
        moveCursorOffset: { row: 2, col: 4 },
      });
    },

    pre(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n```\n\n```\n",
        emptyCursorOffset: { row: 3, col: 0 },
        wrapText: (text) => "\n\n```\n" + text + "\n```\n",
        moveCursorOffset: { row: 3, col: 3 },
      });
    },

    latex(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n<latex>\n\n</latex>\n",
        emptyCursorOffset: { row: 3, col: 7 },
        wrapText: (text) => "\n\n<latex>\n" + text + "\n</latex>\n",
        moveCursorOffset: { row: 3, col: 6 },
      });
    },

    blockquote(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n> \n",
        emptyCursorOffset: { row: 2, col: 2 },
        wrapText: (text) => "\n\n> " + text + "\n",
        moveCursorOffset: { row: 2, col: 2 },
      });
    },

    unorderedList(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n* ",
        emptyCursorOffset: { row: 2, col: 2 },
        wrapText: (text) => "\n\n* " + text,
        moveCursorOffset: { row: 2, col: 2 },
      });
    },

    orderedList(editor) {
      this.insertBlock(editor, {
        emptyText: "\n\n1. ",
        emptyCursorOffset: { row: 2, col: 3 },
        wrapText: (text) => "\n\n1. " + text,
        moveCursorOffset: { row: 2, col: 3 },
      });
    },

    link(editor) {
      const originalRange = editor.getSelectionRange();
      if (editor.selection.isEmpty()) {
        const curpos = editor.getCursorPosition();
        editor.session.insert(curpos, " [](https://) ");
        editor.focus();
        editor.selection.moveTo(curpos.row, curpos.column + 2);
      } else {
        const selectedText = editor.session.getTextRange(originalRange);
        editor.session.replace(originalRange, "[" + selectedText + "](https://) ");
        editor.focus();
        editor.selection.moveTo(originalRange.end.row, originalRange.end.column + 10);
      }
    },

    imageLink(editor, imageData) {
      if (typeof imageData === "undefined") {
        const originalRange = editor.getSelectionRange();
        if (editor.selection.isEmpty()) {
          const curpos = editor.getCursorPosition();
          editor.session.insert(curpos, " ![](https://)");
          editor.focus();
          editor.selection.moveTo(curpos.row, curpos.column + 3);
        } else {
          const selectedText = editor.session.getTextRange(originalRange);
          editor.session.replace(originalRange, "![" + selectedText + "](https://)");
          editor.focus();
          editor.selection.moveTo(originalRange.end.row, originalRange.end.column + 11);
        }
      } else {
        const curpos = editor.getCursorPosition();
        editor.session.insert(curpos, "![" + imageData.name + "](" + imageData.link + ")");
        editor.focus();
        editor.selection.moveTo(curpos.row, curpos.column + imageData.name.length + 2);
      }
    },

    mention(editor) {
      const originalRange = editor.getSelectionRange();
      if (editor.selection.isEmpty()) {
        const curpos = editor.getCursorPosition();
        editor.session.insert(curpos, " [user:]");
        editor.focus();
        editor.selection.moveTo(curpos.row, curpos.column + 7);
      } else {
        const selectedText = editor.session.getTextRange(originalRange);
        editor.session.replace(originalRange, "[user:" + selectedText + "]");
        editor.focus();
        editor.selection.moveTo(originalRange.end.row, originalRange.end.column + 6);
      }
    },
  };

  const COMMAND_DEFINITIONS = [
    {
      name: "markdownToBold",
      bindKey: { win: "Ctrl-B", mac: "Command-B" },
      selector: ".markdown-bold",
      action: (editor) => MarkdownFormatter.bold(editor),
    },
    {
      name: "markdownToItalic",
      bindKey: { win: "Ctrl-I", mac: "Command-I" },
      selector: ".markdown-italic",
      action: (editor) => MarkdownFormatter.italic(editor),
    },
    {
      name: "markdownToStrikethrough",
      bindKey: { win: "Ctrl-Shift-S", mac: "Command-Option-S" },
      selector: ".markdown-strikethrough",
      action: (editor) => MarkdownFormatter.strikethrough(editor),
    },
    {
      name: "markdownToHorizontal",
      bindKey: { win: "Ctrl-H", mac: "Command-H" },
      selector: ".markdown-horizontal",
      action: (editor) => MarkdownFormatter.horizontal(editor),
    },
    {
      name: "markdownToH1",
      bindKey: { win: "Ctrl-Alt-1", mac: "Command-Option-1" },
      selector: ".markdown-h1",
      action: (editor) => MarkdownFormatter.h1(editor),
    },
    {
      name: "markdownToH2",
      bindKey: { win: "Ctrl-Alt-2", mac: "Command-Option-2" },
      selector: ".markdown-h2",
      action: (editor) => MarkdownFormatter.h2(editor),
    },
    {
      name: "markdownToH3",
      bindKey: { win: "Ctrl-Alt-3", mac: "Command-Option-3" },
      selector: ".markdown-h3",
      action: (editor) => MarkdownFormatter.h3(editor),
    },
    {
      name: "markdownToPre",
      bindKey: { win: "Ctrl-Alt-P", mac: "Command-Option-P" },
      selector: ".markdown-pre",
      action: (editor) => MarkdownFormatter.pre(editor),
    },
    {
      name: "markdownToCode",
      bindKey: { win: "Ctrl-Alt-C", mac: "Command-Option-C" },
      selector: ".markdown-code",
      action: (editor) => MarkdownFormatter.code(editor),
    },
    {
      name: "markdownToInlineMath",
      bindKey: { win: "Ctrl-Alt-I", mac: "Command-Option-I" },
      selector: ".markdown-inline-math",
      action: (editor) => MarkdownFormatter.inlineMath(editor),
    },
    {
      name: "markdownToDisplayMath",
      bindKey: { win: "Ctrl-Alt-D", mac: "Command-Option-D" },
      selector: ".markdown-display-math",
      action: (editor) => MarkdownFormatter.displayMath(editor),
    },
    {
      name: "markdownToLatex",
      bindKey: { win: "Ctrl-Alt-L", mac: "Command-Option-L" },
      selector: ".markdown-latex",
      action: (editor) => MarkdownFormatter.latex(editor),
    },
    {
      name: "markdownToBlockQuote",
      bindKey: { win: "Ctrl-Q", mac: "Command-Q" },
      selector: ".markdown-blockquote",
      action: (editor) => MarkdownFormatter.blockquote(editor),
    },
    {
      name: "markdownToUnorderedList",
      bindKey: { win: "Ctrl-U", mac: "Command-U" },
      selector: ".markdown-unordered-list",
      action: (editor) => MarkdownFormatter.unorderedList(editor),
    },
    {
      name: "markdownToOrderedList",
      bindKey: { win: "Ctrl-Shift+O", mac: "Command-Option-O" },
      selector: ".markdown-ordered-list",
      action: (editor) => MarkdownFormatter.orderedList(editor),
    },
    {
      name: "markdownToLink",
      bindKey: { win: "Ctrl-L", mac: "Command-L" },
      selector: ".markdown-link",
      action: (editor) => MarkdownFormatter.link(editor),
    },
    {
      name: "markdownToImageLink",
      bindKey: { win: "Ctrl-Shift-I", mac: "Command-Option-I" },
      selector: ".markdown-image-link",
      action: (editor, data) => MarkdownFormatter.imageLink(editor, data),
    },
  ];

  const MENTION_COMMAND = {
    name: "markdownToMention",
    bindKey: { win: "Ctrl-M", mac: "Command-M" },
    selector: ".markdown-direct-mention",
    action: (editor) => MarkdownFormatter.mention(editor),
  };

  class MartorEditor {
    constructor($container) {
      this.$container = $container;
      this.fieldName = $container.data("field-name");
      this.$textarea = $("#id_" + this.fieldName);
      this.editorId = "martor-" + this.fieldName;

      if (!$("#" + this.editorId).length) {
        MartorLogger.warn(this.fieldName, `Editor container #${this.editorId} not found.`);
        return;
      }

      this.editor = ace.edit(this.editorId);
      this.config = ConfigParser.parse(this.$textarea);

      this.init();
    }

    init() {
      this.initAceOptions();
      this.initTheme();
      this.initMentionCompleter();
      this.initFieldAttributes();
      this.initResize();
      this.initContentSync();
      this.initTabsAndPreview();
      this.initCommandsAndToolbar();
      this.initUploads();
      this.initFullscreen();

      const initialValue = this.$textarea.val();
      if (initialValue) {
        this.editor.setValue(initialValue, -1);
      }

      MartorLogger.debug(this.fieldName, "Initialized with config:", this.config);
    }

    initAceOptions() {
      this.editor.getSession().setMode("ace/mode/markdown");
      this.editor.getSession().setUseWrapMode(true);
      this.editor.$blockScrolling = Infinity; // ace emits console warnings without this
      this.editor.renderer.setScrollMargin(10, 10);
      this.editor.setAutoScrollEditorIntoView(true);
      this.editor.setShowPrintMargin(false);
      this.editor.setOptions({
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableMultiselect: false,
      });

      if (this.config.living === "true") {
        this.$container.addClass("enable-living");
      }
    }

    initTheme() {
      ThemeManager.applyTheme(this.$container, this.editor);
      ThemeManager.bindAutoThemeListener(() => {
        ThemeManager.applyTheme(this.$container, this.editor);
      });
    }

    initMentionCompleter() {
      if (this.config.mention !== "true") {
        this.editor.completers = [];
        return;
      }

      const searchUrl = this.$textarea.data("search-users-url");
      const mentionWordCompleter = {
        getCompletions: (editor, session, pos, prefix, callback) => {
          const token = session.getTokenAt(pos.row, pos.column.count);
          if (!token || !token.value) {
            callback(null, []);
            return;
          }

          const tokens = token.value.split(/\s+/);
          const lastToken = tokens[tokens.length - 1];

          if (lastToken && lastToken.startsWith("[user:")) {
            // strip '[user:' and trailing ']'
            const usernameQuery = lastToken.slice(6).replace(/\]$/, "");
            if (!searchUrl) {
              callback(null, []);
              return;
            }

            $.ajax({
              url: searchUrl,
              data: {
                username: usernameQuery,
                csrfmiddlewaretoken: CookieHelper.getCsrfToken(),
              },
              success: (response) => {
                if (response && response.status === 200 && Array.isArray(response.data)) {
                  const suggestions = response.data.map((user) => ({
                    caption: user.username,
                    value: user.username,
                    meta: "username",
                  }));
                  callback(null, suggestions);
                } else {
                  callback(null, []);
                }
              },
              error: (xhr, status, error) => {
                MartorLogger.error(this.fieldName, "Mention search request failed:", error);
                callback(null, []);
              },
            });
          } else {
            callback(null, []);
          }
        },
      };

      this.editor.completers = [mentionWordCompleter];
    }

    initFieldAttributes() {
      this.$textarea.attr({ style: "display:none" });
      this.$container
        .find(".martor-toolbar .markdown-selector")
        .attr({ "data-field-name": this.fieldName });
      this.$container.find(".upload-progress").attr({ "data-field-name": this.fieldName });
      this.$container.find(".modal-help-guide").attr({ "data-field-name": this.fieldName });
    }

    initResize() {
      if ($.fn.resizable) {
        $("#" + this.editorId).resizable({
          direction: "bottom",
          stop: () => {
            this.editor.resize();
          },
        });
      }
    }

    initContentSync() {
      this.editor.on("change", () => {
        this.$textarea.val(this.editor.getValue());
      });
    }

    initTabsAndPreview() {
      this.$container.find(".ui.martor-toolbar .ui.dropdown").dropdown();
      this.$container.find(".ui.tab-martor-menu .item").tab();

      const previewTabButton = this.$container.find(
        '.item[data-tab="preview-tab-' + this.fieldName + '"]',
      );
      const editorTabButton = this.$container.find(
        '.item[data-tab="editor-tab-' + this.fieldName + '"]',
      );
      const $toolbar = this.$container.find(".martor-toolbar");

      this.refreshPreview();

      if (this.config.living === "true") {
        this.editor.on("change", () => this.refreshPreview());
      } else {
        previewTabButton.on("click", () => {
          $toolbar.hide();
          this.refreshPreview();
        });
      }

      editorTabButton.on("click", () => {
        $toolbar.show();
      });
    }

    refreshPreview() {
      const previewUrl =
        this.$textarea.data("markdownfy-url") || this.$textarea.data("markdownify-url");
      if (!previewUrl) {
        MartorLogger.warn(this.fieldName, "Missing markdown preview URL configuration.");
        return;
      }

      const currentTab = this.$container.find(
        '.tab.segment[data-tab="preview-tab-' + this.fieldName + '"]',
      );
      const value = this.$textarea.val();
      const form = new FormData();
      form.append("content", value);
      form.append("csrfmiddlewaretoken", CookieHelper.getCsrfToken());

      currentTab.addClass("martor-preview-stale");

      $.ajax({
        url: previewUrl,
        type: "POST",
        data: form,
        processData: false,
        contentType: false,
        success: (response) => {
          if (response) {
            currentTab.html(response).removeClass("martor-preview-stale");
            // notify listeners (e.g. martor-mathjax.js)
            $(document).trigger("martor:preview", [currentTab]);

            if (this.config.hljs === "true" && typeof hljs !== "undefined") {
              currentTab.find("pre").each((_, block) => {
                hljs.highlightBlock(block);
              });
            }
          } else {
            currentTab.html("<p>Nothing to preview</p>").removeClass("martor-preview-stale");
          }
          MartorLogger.debug(this.fieldName, "Preview refreshed successfully.");
        },
        error: (xhr, status, error) => {
          currentTab.removeClass("martor-preview-stale");
          MartorLogger.error(this.fieldName, "Preview render failed:", { xhr, status, error });
        },
      });
    }

    initCommandsAndToolbar() {
      const commands = [...COMMAND_DEFINITIONS];
      if (this.config.mention === "true") {
        commands.push(MENTION_COMMAND);
      }

      commands.forEach((cmd) => {
        this.editor.commands.addCommand({
          name: cmd.name,
          bindKey: cmd.bindKey,
          exec: (editor) => cmd.action(editor),
          readOnly: true,
        });

        if (cmd.selector) {
          this.$container
            .find(`${cmd.selector}[data-field-name="${this.fieldName}"]`)
            .on("click", () => {
              cmd.action(this.editor);
            });
        }
      });
    }

    initUploads() {
      const hasUpload = this.config.imgur === "true";
      const hasMention = this.config.mention === "true";

      const $btnMention = this.$container.find(
        `.markdown-direct-mention[data-field-name="${this.fieldName}"]`,
      );
      const $btnUpload = this.$container.find(
        `.markdown-image-upload[data-field-name="${this.fieldName}"]`,
      );

      if (!hasMention) {
        $btnMention.remove();
      }
      if (!hasUpload) {
        $btnUpload.remove();
      } else {
        $btnUpload.on("change", (evt) => {
          evt.preventDefault();
          const fileInput = $btnUpload.find('input[type="file"]');
          const file =
            fileInput.length && fileInput[0].files && fileInput[0].files[0]
              ? fileInput[0].files[0]
              : null;
          this.uploadImage(file);
          if (fileInput.length) {
            fileInput.val("");
          }
        });

        this.$container.get(0).addEventListener("paste", (event) => {
          const clipboardData = event.clipboardData;
          if (!clipboardData || !clipboardData.items) {
            return;
          }
          const imageItems = Object.values(clipboardData.items).filter(
            (item) => item.type && item.type.match(/^image\//),
          );
          if (imageItems.length === 1) {
            event.preventDefault();
            this.uploadImage(imageItems[0].getAsFile());
          }
        });
      }
    }

    uploadImage(imageFile) {
      if (!imageFile) {
        MartorLogger.warn(this.fieldName, "Upload aborted: No image file selected.");
        return;
      }

      const uploadUrl = this.$textarea.data("upload-url");
      if (!uploadUrl) {
        MartorLogger.error(this.fieldName, "Upload aborted: Missing data-upload-url.");
        return;
      }

      const form = new FormData();
      form.append("markdown-image-upload", imageFile);
      form.append("csrfmiddlewaretoken", CookieHelper.getCsrfToken());

      const $progress = this.$container.find(
        `.upload-progress[data-field-name="${this.fieldName}"]`,
      );
      $progress.addClass("active").removeAttr("hidden").show();

      const hideProgress = () => {
        $progress.removeClass("active").attr("hidden", "").hide();
      };

      MartorLogger.info(
        this.fieldName,
        `Uploading image: ${imageFile.name} (${imageFile.size} bytes)...`,
      );

      $.ajax({
        url: uploadUrl,
        type: "POST",
        data: form,
        async: true,
        cache: false,
        contentType: false,
        enctype: "multipart/form-data",
        processData: false,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        success: (response) => {
          hideProgress();
          if (typeof response === "string") {
            try {
              response = JSON.parse(response);
            } catch (err) {
              MartorLogger.warn(this.fieldName, "Could not parse JSON response:", err);
            }
          }
          if (response && (response.status === 200 || response.status === "200")) {
            MartorLogger.info(this.fieldName, "Upload succeeded:", response);
            MarkdownFormatter.imageLink(this.editor, { name: response.name, link: response.link });
          } else {
            const errorMsg = (response && (response.error || response.reason)) || "Upload failed.";
            MartorLogger.error(this.fieldName, "Upload rejected by server:", errorMsg);
            alert(errorMsg);
          }
        },
        error: (xhr, status, error) => {
          hideProgress();
          let errorMsg = error || "Network error";
          if (xhr && xhr.responseText) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed && (parsed.error || parsed.reason)) {
                errorMsg = parsed.error || parsed.reason;
              } else {
                errorMsg = xhr.responseText;
              }
            } catch (e) {
              errorMsg = xhr.responseText;
            }
          }
          MartorLogger.error(this.fieldName, "Upload network error:", { xhr, status, error });
          alert("Upload failed: " + errorMsg);
        },
        complete: () => {
          hideProgress();
        },
      });
    }

    initFullscreen() {
      const $btnToggle = this.$container.find(
        `.markdown-toggle-maximize[data-field-name="${this.fieldName}"]`,
      );
      const $field = this.$container.find(".martor-field-" + this.fieldName);
      const $preview = this.$container.find(".martor-preview");

      const toggleFullscreen = (enable) => {
        const willBeFullscreen =
          enable !== undefined ? enable : !this.$container.hasClass("main-martor-fullscreen");

        if (willBeFullscreen) {
          $(document.body).addClass("overflow");
          this.$container.addClass("main-martor-fullscreen");
          $btnToggle.attr("title", "Minimize");
          $btnToggle.find(".maximize.icon").removeClass("maximize").addClass("minimize");

          const clientHeight = document.body.clientHeight - 90;
          $field.attr("style", "height:" + clientHeight + "px");
          $preview.attr("style", "overflow-y: auto;height:" + clientHeight + "px");
        } else {
          $(document.body).removeClass("overflow");
          this.$container.removeClass("main-martor-fullscreen");
          $btnToggle.attr("title", "Full Screen");
          $btnToggle.find(".minimize.icon").removeClass("minimize").addClass("maximize");

          $field.removeAttr("style");
          $preview.removeAttr("style");
        }
        this.editor.resize();
      };

      $btnToggle.on("click", () => toggleFullscreen());

      // esc closes fullscreen
      $(document).on("keyup.martor", (e) => {
        if (e.keyCode === 27 && this.$container.hasClass("main-martor-fullscreen")) {
          toggleFullscreen(false);
        }
      });
    }
  }

  $.fn.martor = function () {
    $(".martor").trigger("martor.init");

    return this.each(function () {
      const $container = $(this);
      if ($container.data("martor")) {
        return;
      }

      const editorInstance = new MartorEditor($container);
      $container.data("martor", editorInstance);
      if (editorInstance.fieldName) {
        Martor.instances[editorInstance.fieldName] = editorInstance;
      }
    });
  };

  $(function () {
    $(".main-martor").not("[data-field-name*=-__prefix__-]").martor();
  });

  // in django admin dynamic inlines, clone template replacing __prefix__ with the inline index
  if (window.django && window.django.jQuery) {
    window.django.jQuery(document).on("formset:added", function (event) {
      $(event.target)
        .find(".main-martor")
        .each(function () {
          const targetId = event.target.id;
          const indexId = targetId.substr(targetId.lastIndexOf("-") + 1);
          const fixed = $(this.outerHTML.replace(/__prefix__/g, indexId));
          $(this).replaceWith(fixed);
          fixed.martor();
        });
    });
  }
})(
  typeof window !== "undefined" && window.jQuery
    ? window.jQuery
    : typeof jQuery !== "undefined"
    ? jQuery
    : null,
);
