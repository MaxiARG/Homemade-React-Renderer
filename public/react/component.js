function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// ============================================================================
// Component: clase base mínima para componentes de clase y Error Boundaries.
// ============================================================================

import { scheduleUpdate } from './scheduler.js';
/**
 * Clase base al estilo React. Su única razón de ser aquí es habilitar
 * Error Boundaries (que en React deben ser componentes de clase con
 * `getDerivedStateFromError` / `componentDidCatch`).
 */
export var Component = /*#__PURE__*/function () {
  function Component(props) {
    _classCallCheck(this, Component);
    this.props = props;
    this.state = {};
  }
  return _createClass(Component, [{
    key: "setState",
    value: function setState(partial) {
      this.state = _objectSpread(_objectSpread({}, this.state), partial);
      if (this._fiber) {
        this._fiber.hasPendingUpdate = true;
        scheduleUpdate(this._fiber);
      }
    }
  }]);
}();

/** ¿Es `type` un componente de clase? */
_defineProperty(Component, "isReactComponent", true);
export function isClassComponent(type) {
  return typeof type === 'function' && type.isReactComponent === true;
}

/** ¿Este fiber es un Error Boundary (clase con manejador de error)? */
export function isErrorBoundary(fiber) {
  var _type$prototype;
  var type = fiber.type;
  return isClassComponent(fiber.type) && (typeof type.getDerivedStateFromError === 'function' || typeof ((_type$prototype = type.prototype) === null || _type$prototype === void 0 ? void 0 : _type$prototype.componentDidCatch) === 'function');
}