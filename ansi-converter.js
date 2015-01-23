(function(exports) {
  var COLOR_TABLE = {
    '30': '#000',
    '31': '#800000',
    '32': '#008000',
    '33': '#808000',
    '34': '#000080',
    '35': '#800080',
    '36': '#008080',
    '37': '#C0C0C0',
    '30;1': '#808080',
    '31;1': '#FF0000',
    '32;1': '#00FF00',
    '33;1': '#FFFF00',
    '34;1': '#0000FF',
    '35;1': '#FF00FF',
    '36;1': '#00FFFF',
    '37;1': '#FFFFFF',
  };

  var ANSI_ESC = String.fromCharCode(0x1B);
  var ANSI_CODE_REGEX = new RegExp(ANSI_ESC + '\\[(.+?)m', 'g');

  function A() {
  }

  /**
   * Given an ANSI string, format it in HTML.
   *
   * @param {String} ansiString The string to format
   */
  A.prototype.formatAnsi = function(ansiString) {
    var out = ansiString;
    // Remove all of the control characters.
    out = out.replace(new RegExp(String.fromCharCode(65533), 'g'), '');
    // Replace every space with a nbsp.
    out = out.replace(/ /g, '&nbsp;');
    // Replace every ANSI code in the string with the appropriate span.
    out = out.replace(ANSI_CODE_REGEX, this._replaceCodeWithHTML);
    return out;
  };

  /**
   * Replaces an ANSI Code in the string
   * with a span-wrapped version. Used as
   * a callback in the formatAnsi function
   *
   * @param {String} matched The substring that matched
   * @param {String} ansiString The actual matched string
   * @param {Number} index The offset of the match within the overall string
   * @param {String} s The overall string
   */
  A.prototype._replaceCodeWithHTML = function(matched, ansiString, index, s) {
    /*
    // Extract the ansiCode from the string.
    var split = ansiString.split(';');
    var ansiCode = parseInt(split[split.length - 1], 10);
    // Convert code to color code.
    var colorCode = ansiCode - 30;
    */
    // Lookup the corresponding style.
    //var style = 'color: ' + COLOR_TABLE[colorCode];
    if (ansiString == 0) {
      return '</span>';
    }
    var color = COLOR_TABLE[ansiString];
    if (color == undefined) { console.log(ansiString); }
    var style = 'color: ' + COLOR_TABLE[ansiString];
    return '<span style="' + style + ';">';
  };

  exports.AnsiConverter = A;
})(window);