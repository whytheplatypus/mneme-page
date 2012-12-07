"use strict";


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      requirejs.config({
        //urlArgs: "bust=" +  (new Date()).getTime(),
        
        shim: {
          'marked': {
            deps: [],
            exports: 'marked'
          }
        }
      });
      // AMD. Register as an anonymous module.
      define(['marked'], factory);
    } else {
        // Browser globals
        root.dox = factory(root.marked);
    }
}(this, function (marked) {
/**
 * dox
 * The dox module.
 * @author visionmedia (edited by whytheplatypus)
 */

  // Set default marked options
  marked.setOptions({
    gfm: true,
    pedantic: false,
    sanitize: true,
    // callback for code highlighter
    highlight: function(code, lang) {
      if (lang === 'js') {
        //return javascriptHighlighter(code);
      }
      return code;
    }
  });


  var dox = {};


  /**
   * Library version.
   */

  dox.version = '0.3.2';

  /**
   * Parse comments in the given string of `js`.
   *
   * @param {String} js
   * @param {Object} options
   * @return {Array}
   * @see dox.parseComment
   * @api public
   */

  dox.parseComments = function(js, options){
    options = options || {};
    js = js.replace(/\r\n/gm, '\n');

    var comments = []
      , raw = options.raw
      , comment
      , buf = ''
      , ignore
      , withinMultiline = false
      , withinSingle = false
      , code;

    for (var i = 0, len = js.length; i < len; ++i) {
      // start comment
      if (!withinMultiline && !withinSingle && '/' == js[i] && '*' == js[i+1]) {
        // code following previous comment
        if (buf.trim().length) {
          comment = comments[comments.length - 1];
          if(comment) {
            comment.code = code = buf.trim();
            comment.ctx = dox.parseCodeContext(code);
          }
          buf = '';
        }
        i += 2;
        withinMultiline = true;
        ignore = '!' == js[i];
      // end comment
      } else if (withinMultiline && !withinSingle && '*' == js[i] && '/' == js[i+1]) {
        i += 2;
        buf = buf.replace(/^ *\* ?/gm, '');
        var comment = dox.parseComment(buf, options);
        comment.ignore = ignore;
        comments.push(comment);
        withinMultiline = ignore = false;
        buf = '';
      } else if (!withinSingle && !withinMultiline && '/' == js[i] && '/' == js[i+1]) {
        withinSingle = true;
        buf += js[i];
      } else if (withinSingle && !withinMultiline && '\n' == js[i]) {
        withinSingle = false;
        buf += js[i];
      // buffer comment or code
      } else {
        buf += js[i];
      }
    }

    if (comments.length === 0) {
      comments.push({
        tags: [],
        description: {full: '', summary: '', body: ''},
        isPrivate: false
      });
    }

    // trailing code
    if (buf.trim().length) {
      comment = comments[comments.length - 1];
      code = buf.trim();
      comment.code = code;
      comment.ctx = dox.parseCodeContext(code);
    }

    return comments;
  };

  /**
   * Parse the given comment `str`.
   *
   * The comment object returned contains the following
   *
   *  - `tags`  array of tag objects
   *  - `description` the first line of the comment
   *  - `body` lines following the description
   *  - `content` both the description and the body
   *  - `isPrivate` true when "@api private" is used
   *
   * @param {String} str
   * @param {Object} options
   * @return {Object}
   * @see dox.parseTag
   * @api public
   */

  dox.parseComment = function(str, options) {
    str = str.trim();
    options = options || {};

    var comment = { tags: [] }
      , raw = options.raw
      , description = {};

    // parse comment body
    description.full = str.split('\n@')[0];
    description.summary = description.full.split('\n\n')[0];
    description.body = description.full.split('\n\n').slice(1).join('\n\n');
    comment.description = description;

    // parse tags
    if (~str.indexOf('\n@')) {
      var tags = '@' + str.split('\n@').slice(1).join('\n@');
      comment.tags = tags.split('\n').map(dox.parseTag);
      comment.isPrivate = comment.tags.some(function(tag){
        return 'api' == tag.type && 'private' == tag.visibility;
      })
    }

    // markdown
    if (!raw) {
      description.full = marked(description.full);
      description.summary = marked(description.summary);
      description.body = marked(description.body);
    }

    return comment;
  }

  /**
   * Parse tag string "@param {Array} name description" etc.
   *
   * @param {String}
   * @return {Object}
   * @api public
   */

  dox.parseTag = function(str) {
    var tag = {} 
      , parts = str.split(/ +/)
      , type = tag.type = parts.shift().replace('@', '');

    switch (type) {
      case 'param':
        tag.types = dox.parseTagTypes(parts.shift());
        tag.name = parts.shift() || '';
        tag.description = parts.join(' ');
        break;
      case 'return':
        tag.types = dox.parseTagTypes(parts.shift());
        tag.description = parts.join(' ');
        break;
      case 'see':
        if (~str.indexOf('http')) {
          tag.title = parts.length > 1
            ? parts.shift()
            : '';
          tag.url = parts.join(' ');
        } else {
          tag.local = parts.join(' ');
        }
      case 'api':
        tag.visibility = parts.shift();
        break;
      case 'type':
        tag.types = dox.parseTagTypes(parts.shift());
        break;
      case 'memberOf':
        tag.parent = parts.shift();
        break;
      case 'augments':
        tag.otherClass = parts.shift();
        break;
      case 'borrows':
        tag.otherMemberName = parts.join(' ').split(' as ')[0];
        tag.thisMemberName = parts.join(' ').split(' as ')[1];
        break;
      default:
        tag.string = parts.join(' ');
        break;
    }

    return tag;
  }

  /**
   * Parse tag type string "{Array|Object}" etc.
   *
   * @param {String} str
   * @return {Array}
   * @api public
   */

  dox.parseTagTypes = function(str) {
    return str
      .replace(/[{}]/g, '')
      .split(/ *[|,\/] */);
  };

  /**
   * Parse the context from the given `str` of js.
   *
   * This method attempts to discover the context
   * for the comment based on it's code. Currently
   * supports:
   *
   *   - function statements
   *   - function expressions
   *   - prototype methods
   *   - prototype properties
   *   - methods
   *   - properties
   *   - declarations
   *
   * @param {String} str
   * @return {Object}
   * @api public
   */

  dox.parseCodeContext = function(str){
    var str = str.split('\n')[0];

    // function statement
    if (/^function (\w+) *\(((\w+)*(, *\w+)*)\)/.exec(str)) {
      return {
          type: 'function'
        , name: RegExp.$1
        , string: RegExp.$1 + '('+RegExp.$2+')'
      };
    // function expression
    } else if (/^var *(\w+) *= *function *\(((\w+)*(, *\w+)*)\)/.exec(str)) {
      return {
          type: 'function'
        , name: RegExp.$1
        , string: RegExp.$1 + '('+RegExp.$2+')'
      };
    // prototype method
    } else if (/^(\w+)\.prototype\.(\w+) *= *function *\(((\w+)*(, *\w+)*)\)/.exec(str)) {
      return {
          type: 'method'
        , constructor: RegExp.$1
        , cons: RegExp.$1
        , name: RegExp.$2
        , string: RegExp.$1 + '.prototype.' + RegExp.$2 + '('+RegExp.$3+')'
      };
    // prototype property
    } else if (/^(\w+)\.prototype\.(\w+) *= *([^\n;]+)/.exec(str)) {
      return {
          type: 'property'
        , constructor: RegExp.$1
        , cons: RegExp.$1
        , name: RegExp.$2
        , value: RegExp.$3
        , string: RegExp.$1 + '.prototype' + RegExp.$2
      };
    // method
    } else if (/^([\w.]+)\.(\w+) *= *function *\(((\w+)*(, *\w+)*)\)/.exec(str)) {
      return {
          type: 'method'
        , receiver: RegExp.$1
        , name: RegExp.$2
        , string: RegExp.$1 + '.' + RegExp.$2 + '('+RegExp.$3+')'
      };
    // property
    } else if (/^(\w+)\.(\w+) *= *([^\n;]+)/.exec(str)) {
      return {
          type: 'property'
        , receiver: RegExp.$1
        , name: RegExp.$2
        , value: RegExp.$3
        , string: RegExp.$1 + '.' + RegExp.$2
      };
    // declaration
    } else if (/^var +(\w+) *= *([^\n;]+)/.exec(str)) {
      return {
          type: 'declaration'
        , name: RegExp.$1
        , value: RegExp.$2
        , string: RegExp.$1
      };
    }
  };

  return dox;
}));

