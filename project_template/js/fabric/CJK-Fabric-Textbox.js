class CJKTextbox extends fabric.IText {
  textAlign = 'right';
  direction = 'rtl';
  type = 'cjk-vertical';

  initDimensions() {
    this.textAlign = 'right';
    this.direction = 'rtl';
    return super.initDimensions.call(this)
  }

  _renderTextCommon(ctx, method) {
    ctx.save();
    var lineHeights = 0, left = this._getLeftOffset(), top = this._getTopOffset();
    for (var i = 0, len = this._textLines.length; i < len; i++) {
      if (!this.__charBounds[i]) {
        this.measureLine(i)
      }
      var heightOfLine = this.getHeightOfLine(i);
      this._renderTextLine(
        method,
        ctx,
        this._textLines[i],
        left - lineHeights,
        top,
        i
      );
      lineHeights += heightOfLine;
    }
    ctx.restore();
  }

  _renderChars(method, ctx, line, left, top, lineIndex) {
    // set proper line offset
    var lineHeight = this.getHeightOfLine(lineIndex),
      char = '',
      charBox,
      space = this._getWidthOfCharSpacing(),
      isLtr = this.direction === 'ltr', sign = this.direction === 'ltr' ? 1 : -1;
    ctx.save();
    // left -= lineHeight * this._fontSizeFraction / this.lineHeight;
    for (var i = 0, len = line.length - 1; i <= len; i++) {
      char = line[i];
      charBox = this.__charBounds[lineIndex][i];

      ctx.canvas.setAttribute('dir', isLtr ? 'ltr' : 'rtl');
      ctx.direction = isLtr ? 'ltr' : 'rtl';
      ctx.textAlign = isLtr ? 'left' : 'right';
      this._renderChar(method,
        ctx,
        lineIndex,
        i,
        char,
        left,
        top + charBox.height * (i + 1) + space - 5,
        0
      );
    }
    ctx.restore();
  }

  _getGraphemeBox(grapheme, lineIndex, charIndex, prevGrapheme, skipLeft) {
    let box = super._getGraphemeBox.call(this, grapheme, lineIndex, charIndex, prevGrapheme, skipLeft)
    box.top = 0;
    if (this.charSpacing !== 0) {
      box.height += this._getWidthOfCharSpacing();
    }
    if (charIndex > 0 && !skipLeft) {
      const previousBox = this.__charBounds[lineIndex][charIndex - 1];
      box.top = previousBox.top + previousBox.height;
    }

    return box;
  }

  calcTextWidth() {
    return super.calcTextHeight.call(this)
  }

  calcTextHeight() {
    let longestLine = 0,
      currentLineHeight = 0,
      space = 0;

    if (this.charSpacing !== 0) {
      space = this._getWidthOfCharSpacing();
    }
    for (var lineIndex = 0, len = this._textLines.length; lineIndex < len; lineIndex++) {
      if (!this.__charBounds[lineIndex]) {
        this._measureLine(lineIndex);
      }
      currentLineHeight = 0;
      for (let charIndex = 0, rlen = this._textLines[lineIndex].length; charIndex < rlen; charIndex++) {
        if (this._textLines[lineIndex][charIndex]) {
          currentLineHeight += this.__charBounds[lineIndex][charIndex].height + space;
        }
        // currentLineHeight += this.getHeightOfChar(lineIndex, charIndex) + space;
      }
      if (currentLineHeight > longestLine) {
        longestLine = currentLineHeight;
      }
    }
    return longestLine;
  }

  getSelectionStartFromPointer(e) {
    var mouseOffset = this.getLocalPointer(e),
      prevHeight = 0,
      width = 0,
      height = 0,
      charIndex = 0,
      lineIndex = 0,
      lineHeight = 0,
      space = 0,
      line;

    if (this.charSpacing !== 0) {
      space = this._getWidthOfCharSpacing();
    }
    // handling of RTL: in order to get things work correctly,
    // we assume RTL writing is mirrored compared to LTR writing.
    // so in position detection we mirror the X offset, and when is time
    // of rendering it, we mirror it again.
    mouseOffset.x = this.width * this.scaleX - mouseOffset.x + width;
    for (var i = 0, len = this._textLines.length; i < len; i++) {
      if (width <= mouseOffset.x) {
        lineHeight = this.getHeightOfLine(i) * this.scaleY;
        width += lineHeight;
        lineIndex = i;
        if (i > 0) {
          charIndex += this._textLines[i - 1].length + this.missingNewlineOffset(i - 1);
        }
      }
      else {
        break;
      }
    }
    line = this._textLines[lineIndex];
    for (var j = 0, jlen = line.length; j < jlen; j++) {
      prevHeight = height;
      height += this.getHeightOfChar(lineIndex, j) * this.scaleY + space;
      if (height <= mouseOffset.y) {
        charIndex++;
      }
      else {
        break;
      }
    }
    return this._getNewSelectionStartFromOffset(mouseOffset, prevHeight, height, charIndex, jlen);
  }

  _getNewSelectionStartFromOffset(mouseOffset, prevHeight, height, index, jlen) {
    // we need Math.abs because when width is after the last char, the offset is given as 1, while is 0
    var distanceBtwLastCharAndCursor = mouseOffset.y - prevHeight,
      distanceBtwNextCharAndCursor = height - mouseOffset.y,
      offset = distanceBtwNextCharAndCursor > distanceBtwLastCharAndCursor ||
        distanceBtwNextCharAndCursor < 0 ? 0 : 1,
      newSelectionStart = index + offset;
    // if object is horizontally flipped, mirror cursor location from the end
    if (this.flipX) {
      newSelectionStart = jlen - newSelectionStart;
    }

    if (newSelectionStart > this._text.length) {
      newSelectionStart = this._text.length;
    }

    return newSelectionStart;
  }

  _getCursorBoundariesOffsets(position) {
    if (this.cursorOffsetCache && 'top' in this.cursorOffsetCache) {
      return this.cursorOffsetCache;
    }
    var lineLeftOffset,
      lineIndex,
      charIndex,
      topOffset = 0,
      leftOffset = 0,
      boundaries,
      cursorPosition = this.get2DCursorLocation(position);
    charIndex = cursorPosition.charIndex;
    lineIndex = cursorPosition.lineIndex;
    for (var i = 0; i < lineIndex; i++) {
      leftOffset += this.getHeightOfLine(i);
    }

    for (var i = 0; i < charIndex; i++) {
      topOffset += this.getHeightOfChar(lineIndex, charIndex);
    }

    lineLeftOffset = this._getLineLeftOffset(lineIndex);
    var bound = this.__charBounds[lineIndex][charIndex];
    // bound && (leftOffset = bound.left);
    if (this.charSpacing !== 0 && charIndex === this._textLines[lineIndex].length) {
      leftOffset -= this._getWidthOfCharSpacing();
    }
    boundaries = {
      top: lineLeftOffset + (topOffset > 0 ? topOffset : 0),
      left: leftOffset,
    };
    if (this.direction === 'rtl') {
      boundaries.left *= -1;
    }

    this.cursorOffsetCache = boundaries;
    return this.cursorOffsetCache;
  }

  _getGraphemeBox(grapheme, lineIndex, charIndex, prevGrapheme, skipLeft) {
    let box = super._getGraphemeBox(grapheme, lineIndex, charIndex, prevGrapheme, skipLeft);
    box.top = 0;

    if (charIndex > 0 && !skipLeft) {
      const previousBox = this.__charBounds[lineIndex][charIndex - 1];
      box.top = previousBox.top + previousBox.height;
    }

    return box;
  }

  /**
   *
   * @param {*} boundaries
   * @param {CanvasRenderingContext2D} ctx
   */
  renderSelection(boundaries, ctx) {
    var selectionStart = this.inCompositionMode ? this.hiddenTextarea.selectionStart : this.selectionStart,
      selectionEnd = this.inCompositionMode ? this.hiddenTextarea.selectionEnd : this.selectionEnd,
      isJustify = this.textAlign.indexOf('justify') !== -1,
      start = this.get2DCursorLocation(selectionStart),
      end = this.get2DCursorLocation(selectionEnd),
      startLine = start.lineIndex,
      endLine = end.lineIndex,
      startChar = start.charIndex < 0 ? 0 : start.charIndex,
      endChar = end.charIndex < 0 ? 0 : end.charIndex;
    for (var i = startLine; i <= endLine; i++) {
      var lineHeight = this.getHeightOfLine(i),
        boxStart = 0, boxEnd = 0;

      if (i === startLine) {
        boxStart = this.__charBounds[startLine][startChar].top;
      }
      if (i >= startLine && i < endLine) {
        boxEnd = isJustify && !this.isEndOfWrapping(i) ? this.height : this.getLineWidth(i) || 5; // WTF is this 5?
      }
      else if (i === endLine) {
        if (endChar === 0) {
          boxEnd = this.__charBounds[endLine][endChar].top;
        }
        else {
          var charSpacing = this._getWidthOfCharSpacing();
          boxEnd = this.__charBounds[endLine][endChar - 1].top
            + this.__charBounds[endLine][endChar].height - charSpacing;
        }
      }
      var drawStart = boundaries.left + lineHeight * i,
        drawWidth = lineHeight,
        drawHeight = boxEnd - boxStart;

      if (this.lineHeight < 1 || (i === endLine && this.lineHeight > 1)) {
        drawWidth /= this.lineHeight;
      }
      if (this.inCompositionMode) {
        ctx.fillStyle = this.compositionColor || 'black';
      }
      else {
        ctx.fillStyle = this.selectionColor;
      }
      if (this.direction === 'rtl') {
        drawStart = this.width - drawStart - drawWidth;
      }
      ctx.fillRect(
        drawStart,
        boundaries.top + boxStart,
        drawWidth,
        drawHeight,
      );
    }
  }


  renderCursor(boundaries, ctx) {
    var cursorLocation = this.get2DCursorLocation(),
      lineIndex = cursorLocation.lineIndex,
      charIndex = cursorLocation.charIndex > 0 ? cursorLocation.charIndex - 1 : 0,
      charHeight = this.getValueOfPropertyAt(lineIndex, charIndex, 'fontSize'),
      multiplier = this.scaleX * this.canvas.getZoom(),
      cursorWidth = this.cursorWidth / multiplier,
      topOffset = boundaries.topOffset,
      dy = this.getValueOfPropertyAt(lineIndex, charIndex, 'deltaY');
    topOffset += (1 - this._fontSizeFraction) * this.getHeightOfLine(lineIndex) / this.lineHeight
      - charHeight * (1 - this._fontSizeFraction);

    if (this.inCompositionMode) {
      this.renderSelection(boundaries, ctx);
    }
    ctx.fillStyle = this.cursorColor || this.getValueOfPropertyAt(lineIndex, charIndex, 'fill');
    ctx.globalAlpha = this.__isMousedown ? 1 : this._currentCursorOpacity;
    ctx.fillRect(
      boundaries.left + boundaries.leftOffset - charHeight,
      topOffset + boundaries.top + dy - this.lineHeight,
      charHeight,
      cursorWidth,
    );
  }
}
