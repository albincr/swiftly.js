import * as list from "./tokens";

/**
 * Lexer
 * @class Lexer
 * @export
 */
export default class Lexer {

  /**
   * @constructor
   */
  constructor() {

    /**
     * Operand lookup map
     * @type {Object}
     */
    this.TOKEN = list.TOKEN;

    /**
     * Ignore token list
     * @type {Array}
     */
    this.IGNORE = list.IGNORE;

    /**
     * Stream buffer
     * @type {String}
     */
    this.buffer = null;

    /**
     * Stream index
     * @type {Number}
     */
    this.index = 0;

  }

  /**
   * Is digit
   * @param {Number} c
   * @return {Boolean}
   */
  isDigit(c) {
    return (
      c >= 48 && c <= 57
    );
  }

  /**
   * Is alpha
   * @param {Number} c
   * @return {Boolean}
   */
  isAlpha(c) {
    return (
      c > 64 && c < 91 ||
      c > 96 && c < 123
    );
  }

  /**
   * Is alpha digit
   * @param {Number} c
   * @return {Boolean}
   */
  isAlphaDigit(c) {
    return (
      c > 47 && c < 58  ||
      c > 64 && c < 91  ||
      c > 96 && c < 123 ||
      c === 95
    );
  }

  /**
   * Is string
   * @param {Number} c
   * @return {Boolean}
   */
  isString(c) {
    return (
      c === 34 || c === 39
    );
  }

  /**
   * Token validation
   * @param  {Object}  token
   * @return {Boolean}
   */
  isValidToken(token) {
    return (
      token.kind !== void 0 &&
      this.IGNORE.indexOf(token.kind) <= -1
    );
  }

  /**
   * Token kind validation
   * @param  {String}  kind
   * @return {Boolean}
   */
  isIgnoredName(kind) {
    return (
      this.IGNORE.indexOf(kind) <= -1
    );
  }

  /**
   * Creates number token
   * @return {Object}
   */
  readNumber() {

    let end = this.index + 1;

    let c = null;

    for (; end < this.length; ++end) {
      c = this.buffer.charAt(end).charCodeAt(0);
      /** Also check for floating numbers */
      if (c !== 46 && this.isDigit(c) === false) break;
    };

    let value = this.buffer.slice(this.index, end);

    this.index = end;

    return ({
      kind: this.TOKEN.number,
      value: value
    });

  }

  /**
   * Creates identifier or keyword token
   * @return {Object}
   */
  readIdentifier() {

    let end = this.index + 1;

    for (; end < this.length && this.isAlphaDigit(this.buffer.charAt(end).charCodeAt(0)) === true; ++end) {};

    let value = this.buffer.slice(this.index, end);

    this.index = end;

    /** Keyword */
    if (this.TOKEN[value] !== void 0) {
      return ({
        kind: this.TOKEN[value],
        value: value
      });
    /** Identifier */
    } else {
      return ({
        kind: this.TOKEN.identifier,
        value: value
      });
    }

  }

  /**
   * Creates string token
   * @return {Object}
   */
  readString() {

    let end = this.buffer.indexOf("'", this.index + 1);

    if (end === -1) {
      end = this.buffer.indexOf('"', this.index + 1);
      if (end === -1) throw new Error(`Unexpected quote at ${ this.index }!`);
    }

    let token = {
      kind: this.TOKEN.string,
      value: this.buffer.slice(this.index, end + 1)
    };

    this.index = end + 1;

    return (token);

  }

  readNegativeNumber() {

    let node = null;

    node = this.readNumber();

    node.value = "-" + node.value;

    return (node);

  }

  /**
   * Read sign
   * @return {Object}
   */
  readSign() {

    let c = null;

    let code = 0;

    let kind = null;

    let value = "";

    for (;true;) {
      c = this.buffer.charAt(this.index);
      code = c.charCodeAt(0);
      if (this.isDigit(code) === true) {
        if (value === "-") {
          return (this.readNegativeNumber());
        }
      }
      if (this.TOKEN[value + c] === void 0) break;
      value += c;
      this.index++;
      kind = this.TOKEN[value];
      if (this.index > this.length) break;
    };

    return ({
      kind: kind,
      value: value
    });

  }

  /**
   * Lexical analysis
   * @param {String} stream
   * @return {Array}
   */
  lex(stream) {

    this.index  = 0;
    this.buffer = stream;
    this.length = this.buffer.length;

    let c       = null;
    let op      = null;
    let cCode   = 0;
    let token   = null;

    let tokens = [];

    for (;true;) {

      if (!(c = this.buffer.charAt(this.index)) || this.index >= this.length) break;

      cCode = c.charCodeAt(0);

      if ((op = this.TOKEN[c]) !== void 0) {
        token = this.readSign();
        if (this.isValidToken(token) === true) tokens.push(token);
      }
      else if (this.isDigit(cCode) === true) {
        token = this.readNumber();
        if (this.isValidToken(token) === true) tokens.push(token);
      }
      else if (this.isAlpha(cCode) === true) {
        token = this.readIdentifier();
        if (this.isValidToken(token) === true) tokens.push(token);
      }
      else if (this.isString(cCode) === true) {
        token = this.readString();
        if (this.isValidToken(token) === true) tokens.push(token);
      }

    };

    return (tokens);

  }

}