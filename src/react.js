const RENDER_TO_DOM = Symbol("RENDER_DOM");

class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
    this.range = null;
    this.root = null;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  get vDom() {
    return this.render().vDom;
  }

  appendChild(vChild) {
    this.children.push(vChild);
  }

  [RENDER_TO_DOM](range) {
    this.range = range;
    this._range = range;
    this._vDom = this.vDom;
    this._vDom[RENDER_TO_DOM](range)
  }

  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false;
      }
      for (let name in newNode.type) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false;
        }
      }
      if (Object.keys(newNode.props).length !== Object.keys(oldNode.props).length) {
        return false;
      }
      if (newNode.type === "#text") {
        if (newNode.content !== oldNode.content) {
          return false;
        }
      }
      return true;
    }

    let update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        return newNode[RENDER_TO_DOM](oldNode.range);
      }
      newNode.range = oldNode.range;

      let newChildren = newNode.vChildren;
      let oldChildren = oldNode.vChildren;

      if (!newChildren || !newChildren.length) {
        return;
      }

      var tailRange = oldChildren[oldChildren.length - 1].range;

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          var range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }

    }
    let vDom = this.vDom;
    update(this._vDom, vDom);
    this._vDom = vDom;
  }

  setState(nextState) {
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState;
      return this.update();
    }


    let merge = (oldS, newS) => {
      for (let p in newS) {
        if (typeof newS[p] === "object") {
          if (typeof oldS[p] !== "object") {
            oldS[p] = {};
          }
          merge(oldS[p], newS[p]);
        } else {
          oldS[p] = newS[p];
        }
      }
    }
    // if (!this.state && nextState) {
    //   this.state = {};
    // }
    merge(this.state, nextState);
    this.update();
  }

}

class EleWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }

  [RENDER_TO_DOM](range) {
    this.range = range;
    this._range = range;

    let root = document.createElement(this.type);

    for (let name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        const eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLocaleLowerCase())
        root.addEventListener(eventName, value);
      } else {
        if (name === "className") name = "class";
        root.setAttribute(name, value)
      }
    }

    if (!this.vChildren) {
      this.vChildren = this.children.map(child => child.vDom);
    }

    for (let child of this.children) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      child[RENDER_TO_DOM](childRange);
    }


    replaceRange(range, root);
  }
  get vDom() {
    this.vChildren = this.children.map(child => child.vDom)
    return this;
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content);
    this.type = '#text';
    this.content = content;
  }
  [RENDER_TO_DOM](range) {
    this.range = range;
    this._range = range;

    var root = document.createTextNode(this.content);
    replaceRange(range, root);

  }

  get vDom() {
    return this;
  }
}

function replaceRange(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setStartAfter(node);
}

export const React = {
  createElement(type, attr, ...children) {
    let ele;
    if (typeof type === "string") {
      ele = new EleWrapper(type);
    } else {
      /**
       * 自定义组件属性配置
       */
      ele = new type;
    }
    for (let key in attr) {
      ele.setAttribute(key, attr[key]);
    }
    let insertChilren = (children) => {
      if (children && children.length) {
        for (let child of children) {
          if (typeof child === "string") {
            child = new TextWrapper(child);
          }
          if (child === null) {
            continue;
          }
          if (typeof child === "object" && child instanceof Array) {
            insertChilren(child);
          } else {
            ele.appendChild(child);
          }
        }
      }
    }
    insertChilren(children)
    return ele;
  },
  render(vDom, ele) {
    let range = document.createRange();
    range.setStart(ele, 0);
    range.setEndAfter(ele, ele.childNodes.length);
    range.deleteContents();
    vDom[RENDER_TO_DOM](range);
  },
  Component,
}
