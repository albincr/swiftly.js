import {
  TOKEN
} from "../Tokenize/tokens";

import { Types } from "../Parse/nodes";

/**
 * Semantic
 * @class Semantic
 * @export
 */
export default class Semantic{

  /**
   * @constructor
   */
  constructor() {
    this.scope = null;
  }

  /**
   * Enter new scope
   * @param {Scope} scope
   */
  pushScope(scope) {
    this.scope = scope;
  }

  /** Enter previous scope */
  popScope() {
    this.scope = this.scope.parent;
  }

  /**
   * Compile ast
   * @param  {Program} ast
   * @return {String}
   */
  analyze(ast) {

    this.pushScope(ast.context);

    this.analyzeBlock(ast.body.body);

    this.scope = ast.context;

  }

  /**
   * Numeric check
   * @param  {*}  value
   * @return {Boolean}
   */
  isNumber(value) {
    return (
      (Number(value) >= 0 || Number(value) < 0)
    );
  }

  analyzeBlock(ast) {

    for (let node of ast) {
      if (node.kind === Types.Statement) {
        this.analyzeStatement(node);
      }
    };

  }

  analyzeStatement(ast) {

    let body = ast.body || ast;

    switch (body.kind) {
      case Types.ImportStatement:
        this.analyzeImport(body);
      break;
      case Types.VariableDeclaration:
        this.analyzeVariableDeclaration(body);
      break;
      case Types.MultipleVariableDeclaration:
        this.analyzeMultipleVariableDeclaration(body);
      break;
      case Types.IfStatement:
        this.analyzeIfStatement(body);
      break;
      case Types.FunctionDeclaration:
        this.analyzeFunctionDeclaration(ast);
      break;
      case Types.ReturnStatement:
        this.analyzeReturnStatement(body);
      break;
      case Types.Enumeration:
        this.analyzeEnumeration(ast);
      break;
      case Types.CallExpression:
        this.analyzeCallExpression(body);
      break;
      case Types.MemberExpression:
        this.analyzeMemberExpression(body);
      break;
      case Types.Literal:
      case Types.Parameter:
      case Types.Identifier:
        this.analyzeIdentifier(body);
      break;
      default:
        this.analyzeBinaryExpression(body);
      break;
    };

  }

  /**
   * Analyze identifier
   * @param  {Node} ast
   * @return {String}
   */
  analyzeIdentifier(ast, isMember) {

    let parent = null;

    if (ast.kind === Types.Identifier) {
      if ((parent = this.scope.get(ast.name, this.scope))) {
        /** Declared as pointer */
        if (ast.isPointer) {
          return (ast.name);
        }
        /** Check if parent is a inout reference */
        if (parent.kind === Types.Parameter) {
          /** Parent is a reference */
          if (!ast.isPointer && parent.reference) {
            return (`${ast.name}.value`);
          }
        } else {
          if (parent.isReference) {
            return (`${ast.name}.value`);
          }
        }
      }
    } else if (
      ast.kind === Types.Literal ||
      ast.kind === Types.Parameter
    ) {
      return (ast.value);
    }

    return (ast.name);

  }

  analyzeMemberExpression(ast) {

    this.analyzeStatement(ast.left);
    if (ast.right.kind === Types.Identifier) {
      this.analyzeIdentifier(ast.right, true);
    } else {
      this.analyzeStatement(ast.right);
    }

  }

  analyzeCallExpression(ast) {

    let param = ast.arguments;
    let callee = this.analyzeStatement(ast.callee);

    let ii = 0;
    let length = param.length;

    let name = null;

    for (; ii < length; ++ii) {
      name = param[ii].value;
      this.analyzeStatement(param[ii]);
      if (ii + 1 < length) {}
    };

  }

  analyzeEnumeration(ast) {

    let body = ast.body;
    let extern = ast.export;

    this.analyzeEnumerationBody(body);

  }

  analyzeEnumerationBody(body) {

    let param = body.body;

    let name = body.name;

    let ii = 0;
    let index = 0;
    let length = param.length;

  }

  analyzeReturnStatement(ast) {

    if (ast.argument) {
      let scope = this.scope.getByType(Types.FunctionDeclaration);
      if (scope.returns.length) {
        let returns = scope.returns;
        let ii = 0;
        let length = returns.length;
        for (; ii < length; ++ii) {
          this.analyzeBinaryExpression(ast.argument[ii]);
          if (ii + 1 < length) {}
        };
      } else {
        this.analyzeBinaryExpression(ast.argument);
      }
    }

  }

  analyzeIfStatement(ast) {

    this.analyzeBinaryExpression(ast.test);

    if (ast.consequent !== null) {
      this.pushScope(ast.context);
      this.analyzeBlock(ast.consequent.body);
      this.popScope();
    }

    if (ast.alternate !== null) {
      /** Else if */
      if (ast.alternate.kind === Types.Block) {
        this.pushScope(ast.context);
        this.analyzeBlock(ast.alternate.body);
        this.popScope();
      /** Standalone else */
      } else {
        this.analyzeIfStatement(ast.alternate);
      }
    }

  }

  analyzeFunctionDeclaration(ast) {

    let body = ast.body;
    let extern = ast.export;
    let name = body.name;

    if (extern) {}

    this.pushScope(ast.body.context);
    this.analyzeParameters(body.param);
    this.analyzeBlock(body.body.body);
    this.popScope();

  }

  analyzeParameters(param) {

    let ii = 0;
    let length = param.length;

    for (; ii < length; ++ii) {
      this.analyzeBinaryExpression(param[ii]);
      if (ii + 1 < length) {}
    };

  }

  analyzeImport(ast) {

    if (ast.body.length < 0) return void 0;

    for (let key of ast.body) {
      if (key.kind === Types.Literal) {
        console.log(key);
      }
    };

  }

  analyzeVariableDeclaration(ast) {

    if (ast.init) {
      if (ast.isReference) {
        this.analyzeBinaryExpression(ast.init);
      } else {
        if (ast.init.kind === Types.ArrayDeclaration) {
          this.analyzeArrayConstruction(ast.init);
        } else {
          this.analyzeBinaryExpression(ast.init);
        }
      }
    }

  }

  analyzeMultipleVariableDeclaration(ast) {

    let ii = 0;
    let length = ast.body.length;

    for (; ii < length; ++ii) {
      this.analyzeVariableDeclaration(ast.body[ii]);
    };

  }

  analyzeArrayConstruction(ast) {
    this.analyzeTupleExpression(ast.param);
  }

  analyzeTupleExpression(param) {

    let ii = 0;
    let length = param.length;

    let key = null;

    for (; ii < length; ++ii) {
      key = param[ii];
      this.analyzeBinaryExpression(key.init);
      if (ii + 1 < length) {}
    };

  }

  /**
   * Binexp eval
   * @param  {Number} l
   * @param  {Number} r
   * @param  {String} o
   * @return {Number}
   */
  evaluateBinaryExpression(l, r, o) {

    switch (o) {
      case "+":
        return (l + r);
      break;
      case "-":
        return (l - r);
      break;
      case "*":
        return (l * r);
      break;
      case "/":
        return (l / r);
      break;
      case ">":
        return (l > r);
      break;
      case "<":
        return (l < r);
      break;
      case "%":
        return (l < r);
      break;
      case "==":
        return (l === r);
      break;
    }

  }

  /**
   * Analyze binexp
   * @param {Node} ast
   */
  analyzeBinaryExpression(ast) {

    if (ast.kind === Types.BinaryExpression) {
      this.analyzeStatement(ast.left);
      this.analyzeOperand(ast.operator);
      this.analyzeStatement(ast.right);
    } else {
      this.analyzeStatement(ast);
    }

  }

  /**
   * Analyze operand
   * @param  {Number} op
   * @return {String}
   */
  analyzeOperand(op) {

    switch (op) {
      case TOKEN["*"]:
        return ("*");
      break;
      case TOKEN["/"]:
        return ("/");
      break;
      case TOKEN["+"]:
        return ("+");
      break;
      case TOKEN["-"]:
        return ("-");
      break;
      case TOKEN[">"]:
        return (">");
      break;
      case TOKEN["<"]:
        return ("<");
      break;
      case TOKEN["="]:
        return ("=");
      break;
      case TOKEN["%"]:
        return ("%");
      break;
      case TOKEN["=="]:
        return ("==");
      break;
      case TOKEN["."]:
        return (".");
      break;
      default:
        console.error("Unknown operand:", op);
    };

  }

}