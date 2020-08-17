const RENDER_TO_DOM = Symbol("RENDER_DOM");

class EleWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      const eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLocaleLowerCase())
      this.root.addEventListener(eventName, value);
    }
    if (name === "className") name = "class";
    this.root.setAttribute(name, value)
  }
  appendChild(vChild) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    vChild[RENDER_TO_DOM](range);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }

}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
  }

  [RENDER_TO_DOM](range) {
    this.range = range;
    this.render()[RENDER_TO_DOM](range)
  }

  reRender() {
    let oldRange = this.range;

    let range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](range);

    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents();
  }

  appendChild(vChild) {
    this.children.push(vChild);
  }

  setState(nextState) {
    console.log(nextState)
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
    if (!this.state && nextState) {
      this.state = {};
    }
    merge(this.state, nextState);
    this.reRender();
  }

  setAttribute(name, value) {
    this[name] = value;
    this.props[name] = value;
  }


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
          if (typeof child === "object" && child instanceof Array) {
            insertChilren(child);
          } else {
            if (
              !(child instanceof Component) &&
              !(child instanceof EleWrapper) &&
              !child instanceof TextWrapper
            ) {
              child = String(child);
            }
            if (typeof child === "string") {
              child = new TextWrapper(child);
            }
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