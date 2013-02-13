"use strict";


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      requirejs.config({
        //urlArgs: "bust=" +  (new Date()).getTime(),
        
        shim: {
          'marked': {
            deps: [],
            exports: 'marked'
          },
          'jsdoc': {
            deps: [],
            exports: 'jsdoc'
          },
          'underscore': {
            deps: [],
            exports: '_'
          }
        }
      });
      // AMD. Register as an anonymous module.
      define(['marked', 'esprima', 'jsdoc'], factory);
    } else {
        // Browser globals
        root.Mneme = factory(root.marked, root.esprima, root.jsdoc, root._);
    }
}(this, function (marked, esprima, jsdoc, _) {

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


  var Mneme = function(){
    var self = this;

    /**
     * Library version.
     */

    self.version = '0.0.1';

    /**
     * Jison generated Parser
     */
    self.parser = jsdoc;
    self.parser.Parser();
    console.log(jsdoc);
    

    self.structured = {};
    /**
     * Parse comments in the given string of `js`.
     *
     * @param {String} js
     * @param {Object} options
     * @return {Array}
     * @see self.parseComment
     * @api public
     */
    
    self.parse = function(input, options, codeContext){
      options = options || {};
      self.structured = {
        functions:{},
        functions_objects:{},
        variales:{}
      };
      self.parser.yy = {
        comments: new Array(),
        reference: -1,
        log: function(input){
          //console.log(input);
        }
      }
      var parsedDoc = self.parser.parse(input);
      self.info = parsedDoc;
      codeContext = codeContext || self.jsCodeContext;
      var result = codeContext(input);//self.parser.parse(input);
      self.raw = result.raw;
      console.log(self.structured);
      return {info:parsedDoc, tree:self.structured};
    }

    self.getCommentByLine = function(start, stop){
      return _.filter(self.info, function(comment){
        if(comment.type == 'line'){
          return comment.loc >= start && comment.loc <= stop;
        } else {
          return (comment.startLoc >= start && comment.startLoc <= stop) || 
                  (comment.stopLoc >= start && comment.stopLoc <= stop);
        }
      });
    }

    self.getCodeByLine = function(start, stop){
      return _.filter(self.raw, function(code){
        return (code.loc.start.line >= start && code.loc.start.line <= stop) || 
                  (code.loc.stop.line >= start && code.loc.stop.line <= stop);
      });
    }

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
    
    function transformSyntax(type, syntax, opts){
      opts = opts || {};
      try{
        return jsSyntaxTransform[type](syntax, opts);
      } catch(e){
        console.log('error:');
        console.log(type);
        console.log(opts);
        console.log(syntax);
        console.log(e);//@todo add tracekit
      }
    }
    
    var jsSyntaxTransform = {
      'FunctionStatement': function(syntax, opts){
        console.log(syntax);
        var result = {
          type: 'function',
          name: syntax.id.name,
          params: syntax.params,
          loc: syntax.id.loc
          //parse body and return statement
        }
        var string = result.name +"(";
        for(var i in result.params){
          string += result.params+","
        }
        string += ")";
        string=string.replace(",)",")"); 
        result.string = string;
        self.structured.functions[result.name] = result;
        return result;
      },
      'VariableDeclaration':function(syntax, opts){
        console.log(syntax);
        var result = new Array();
        for(var i = 0; i < syntax.declarations.length; i++){
          result.push(transformSyntax(syntax.declarations[i].type, syntax.declarations[i]));
        }
        if(result.length == 1){
          result = result[0];
        }
        return result;
      },
      'VariableDeclarator':function(syntax, opts){
        var result = {
          type: 'var',
          name: syntax.id.name,
          loc: syntax.id.loc
        };
        result.content = transformSyntax(syntax.init.type, syntax.init, {name: result.name});
        switch(result.content.type){
          case 'function':
            self.structured.functions_objects[result.name] = result;
          break;
          case 'object':
            self.structured.functions_objects[result.name] = result;
          break;
          default:
            self.structured.variales[result.name] = result;
          break;
        }
        
        return result;
      },
      'ObjectExpression': function(syntax, opts){
        var result = {
          name: opts.name,
          type: 'object',
          properties: {}
        };
        for(var i = 0; i < syntax.properties.length; i++){
          result.properties[syntax.properties[i].key.name] = transformSyntax(syntax.properties[i].value.type, syntax.properties[i].value, {name: syntax.properties[i].key.name});
        }
        return result;
      },
      'FunctionExpression':function(syntax, opts){
        console.log(syntax);
        var result = {
          type: 'function',
          params: syntax.params,
          loc: syntax.loc,
          name: opts.name
          //@todo parse body and return statement
        }
        var string = opts.name +"(";
        for(var i in result.params){
          string += result.params+","
        }
        string += ")";
        string=string.replace(",)",")"); 
        result.string = string;
        return result;
      },
      'ExpressionStatement':function(syntax, opts){
        return transformSyntax(syntax.expression.type, syntax.expression);
      },
      'AssignmentExpression':function(syntax, opts){
        var result = {
          type: 'assignment',
        };
        result.left = transformSyntax(syntax.left.type, syntax.left);
        result.right = transformSyntax(syntax.right.type, syntax.right, {name: result.left.name});//@todo add a path property to left
        function fold(obj){
          console.log(obj);
          if(obj.type == 'member'){
            var pointer = fold(obj['parent']);
            console.log(pointer);
            console.log(obj.name)
            if(obj.name == 'prototype'){
              if(typeof pointer['children'] === 'undefined'){
                pointer['children'] = [];
                pointer['children'].push({name:'prototype', children: new Array()});
              }
            }
            var arrayPointer = _.find(pointer['children'], function(num){ return num.name == obj.name; });
            return pointer['children'][pointer['children'].indexOf(arrayPointer)];
          } else {
            /*if(typeof self.structured['functions_objects'][obj] === 'undefined'){
              self.structured['functions_objects'][obj] = {};
            }
            */
            return self.structured['functions_objects'][obj];
          }
        }
        if(result.left.type == 'member'){
          console.log(result.left);
          var path = fold(result.left.parent);
          console.log(result.left.name);
          console.log(path);
          if(typeof path['children'] === 'undefined'){
            path['children'] = [];
            path['children'].push({name:'prototype', children: new Array()});
          }
          self.structuredResult = result.right;
          if(!_.isObject(self.structuredResult)){
            self.structuredResult = {
              value: result.right
            }
          }
          self.structuredResult.name = result.left.name;
          path['children'].push(self.structuredResult);
        }
        result.name = result.left.name;
        return result;
      },
      'MemberExpression':function(syntax, opts){
        var result = {
          type: 'member',
          name: syntax.property.name,
          parent: transformSyntax(syntax.object.type, syntax.object)
        };

        return result;
      },
      'Identifier':function(syntax, opts){
        console.log(syntax);
        return syntax.name;
      },
      'Literal': function(syntax, opts){
        return syntax.raw;
      },
      'CallExpression': function(syntax, opts){
        var result = {
          type: 'wrapper',
          body: new Array()
        };
        for(var i = 0; i < syntax.callee.body.body.length; i++){
          var body = syntax.callee.body.body[i];
          result.body.push(transformSyntax(body.type, body));
        }
        return result;
      }
    }; 

    self.jsCodeContext = function(code){
      var syntax = esprima.parse(code, {raw: true, loc: true, comment: true, tolerant: true});
      var result = new Array();
      console.log(syntax);
      for(var i = 0; i < syntax.body.length; i++){
        var body = syntax.body[i];
        result.push(transformSyntax(body.type, body));
      }
      console.log(JSON.stringify(self.structured.functions_objects.Key));
      return {raw:result, comments:syntax.comments, errors:syntax.errors};
    };
  };
  return Mneme;
}));

