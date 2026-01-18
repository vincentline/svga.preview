I will regenerate the "SVGA to Dual Channel MP4" panel refactoring, ensuring correctness to avoid page load failures.

**Reason for previous failure (Hypothesis):**
The previous failure likely stemmed from `SvgaPreview.Components.SvgaToMp4Panel` being undefined when `app.js` executed, or a syntax error in the component file. I will ensure strict loading order and namespace initialization.

**Plan:**

1.  **Re-create Component**:
    *   Create `docs/assets/js/components/svga-to-mp4-panel.js`.
    *   Use the same Vue component definition as before, ensuring `window.SvgaPreview.Components` is safely initialized.

2.  **Update Index Component**:
    *   Update `docs/assets/js/components/index.js` to include the new component in the comment list (for documentation).

3.  **Update `index.html`**:
    *   Add `<script src="assets/js/components/svga-to-mp4-panel.js"></script>` **before** `app.js`.
    *   Replace the raw HTML panel with `<svga-to-mp4-panel>`.

4.  **Update `app.js`**:
    *   Register `svga-to-mp4-panel` in the Vue instance `components`.
    *   Remove redundant methods (`toggleChannelModeDropdown`, `selectChannelMode`, etc.).
    *   Update `startMP4Conversion` to accept config.

5.  **Verification**:
    *   I will double-check the file content of `svga-to-mp4-panel.js` to ensure no syntax errors.
    *   I will verify `index.html` script order.
