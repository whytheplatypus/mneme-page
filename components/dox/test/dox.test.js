
/**
 * Module dependencies.
 */
requirejs.config({
  paths: {
    marked: '../components/marked/lib/marked',
  },
  urlArgs: "bust=" +  (new Date()).getTime()
});
require(['../dox', './components/chai/chai'], function(dox, chai){
  chai.should();
  mocha.setup('bdd');
  function fixture(path, fn) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'fixtures/'+path, true);
    //xhr.setRequestHeader('Accept', 'application/vnd.github-blob.raw');
    xhr.onload = function(e){
      fn(e, this.response);
    };
    xhr.send();
  }
  describe("dox", function(){
    describe('the version of dox', function(){
      it("should be of the form '/^\d+\.\d+\.\d+$/", function(){
        dox.version.should.match(/^\d+\.\d+\.\d+$/);
      });
    });
    
    fixture('a.js', function(err, str){
      describe('.parseComments() blocks', function(){
        var comments = dox.parseComments(str, {raw: true})
          , file = comments.shift()
          , version = comments.shift();
        it("should have a property ignore", function(){
          file.should.have.property('ignore', true);
        });
        it("the description should equal A\nCopyright (c) 2010 Author Name <Author Email>\nMIT Licensed", function(){
          file.description.full.should.equal('A\nCopyright (c) 2010 Author Name <Author Email>\nMIT Licensed');
        });
        it("the description summary should be the same", function(){
          file.description.summary.should.equal('A\nCopyright (c) 2010 Author Name <Author Email>\nMIT Licensed');
        });
        it("the description body should be ''", function(){
          file.description.body.should.equal('');
        });
        it("the tags should be empty", function(){
          file.tags.should.be.empty;
        })

        it("the version shouldn't have an ignore property", function(){
          version.should.have.property('ignore', false);
        });
        it("the description should be equal to 'Library version.'", function(){
          version.description.full.should.equal('Library version.');
        });
        it('the version summary should be the same', function(){
          version.description.summary.should.equal('Library version.');
        });
        it('the version body should be empty', function(){
          version.description.body.should.equal('');
        });
        it('the version tags should be empty', function(){
          version.tags.should.be.empty;
        })
      });

    });

    fixture('b.js', function(err, str){
      describe('.parseComments() tags', function(){  
        var comments = dox.parseComments(str);
        it('version', function(){
          var version = comments.shift();
          version.description.summary.should.equal('<p>Library version.\n</p>\n');
          version.description.full.should.equal('<p>Library version.\n</p>\n');
          version.tags.should.have.length(2);
          version.tags[0].type.should.equal('type');
          version.tags[0].types.should.eql(['String']);
          version.tags[1].type.should.equal('api');
          version.tags[1].visibility.should.equal('public');
          version.ctx.type.should.equal('property');
          version.ctx.receiver.should.equal('exports');
          version.ctx.name.should.equal('version');
          version.ctx.value.should.equal("'0.0.1'");
        });

        it('tags', function(){
          var parse = comments.shift();
          parse.description.summary.should.equal('<p>Parse the given <code>str</code>.</p>\n');
          parse.description.body.should.equal('<h2>Examples</h2>\n<pre><code>parse(str)\n// =&gt; &quot;wahoo&quot;</code></pre>\n');
          parse.description.full.should.equal('<p>Parse the given <code>str</code>.\n\n</p>\n<h2>Examples</h2>\n<pre><code>parse(str)\n// =&gt; &quot;wahoo&quot;</code></pre>\n');
          parse.tags[0].type.should.equal('param');
          parse.tags[0].name.should.equal('str');
          parse.tags[0].description.should.equal('to parse');
          parse.tags[0].types.should.eql(['String', 'Buffer']);
          parse.tags[1].type.should.equal('return');
          parse.tags[1].types.should.eql(['String']);
          parse.tags[2].visibility.should.equal('public');
        });
      });
    });

    fixture('c.js', function(err, str){
      describe('test .parseComments() complex', function(){
        it('complex comments', function(){
          var comments = dox.parseComments(str);

          var file = comments.shift();

          file.tags.should.be.empty;
          // the following doesn't work as gh-md now obfuscates emails different on every pass
          //file.description.full.should.equal('<p>Dox<br />Copyright (c) 2010 TJ Holowaychuk <a href=\'mailto:tj@vision-media.ca\'>tj@vision-media.ca</a><br />MIT Licensed</p>');
          file.description.full.should.be.a('string');
          file.ignore.should.be.true;

          var mods = comments.shift();
          mods.tags.should.be.empty;
          mods.description.full.should.equal('<p>Module dependencies.</p>\n');
          mods.description.summary.should.equal('<p>Module dependencies.</p>\n');
          mods.description.body.should.equal('');
          mods.ignore.should.be.false;
          mods.code.should.equal('var markdown = require(\'github-flavored-markdown\').parse;');
          mods.ctx.type.should.equal('declaration');
          mods.ctx.name.should.equal('markdown');
          mods.ctx.value.should.equal('require(\'github-flavored-markdown\').parse');

          var version = comments.shift();
          version.tags.should.be.empty;
          version.description.full.should.equal('<p>Library version.</p>\n');

          var parseComments = comments.shift();
          parseComments.tags.should.have.length(4);
          parseComments.ctx.type.should.equal('method');
          parseComments.ctx.receiver.should.equal('exports');
          parseComments.ctx.name.should.equal('parseComments');
          parseComments.description.full.should.equal('<p>Parse comments in the given string of <code>js</code>.\n</p>\n');
          parseComments.description.summary.should.equal('<p>Parse comments in the given string of <code>js</code>.\n</p>\n');
          parseComments.description.body.should.equal('');

          var parseComment = comments.shift();
          parseComment.tags.should.have.length(4);
          parseComment.description.summary.should.equal('<p>Parse the given comment <code>str</code>.</p>\n');
          parseComment.description.full.should.equal('<p>Parse the given comment <code>str</code>.\n\n</p>\n<h2>The comment object returned contains the following</h2>\n<ul>\n<li><code>tags</code>  array of tag objects</li>\n<li><code>description</code> the first line of the comment</li>\n<li><code>body</code> lines following the description</li>\n<li><code>content</code> both the description and the body</li>\n<li><code>isPrivate</code> true when &quot;@api private&quot; is used</li>\n</ul>\n');
          parseComment.description.body.should.equal('<h2>The comment object returned contains the following</h2>\n<ul>\n<li><code>tags</code>  array of tag objects</li>\n<li><code>description</code> the first line of the comment</li>\n<li><code>body</code> lines following the description</li>\n<li><code>content</code> both the description and the body</li>\n<li><code>isPrivate</code> true when &quot;@api private&quot; is used</li>\n</ul>\n');

          var parseTag = comments.shift();
          
          // Should be the comment be parsed ?
          var shouldNotFail = comments.shift();

          var parseTagTypes = comments.shift();
          parseTagTypes.tags.should.have.length(3);
          parseTagTypes.description.full.should.equal('<p>Parse tag type string &quot;{Array|Object}&quot; etc.\n</p>\n');
          
          var escape = comments.pop();
          escape.tags.should.have.length(3);
          escape.description.full.should.equal('<p>Escape the given <code>html</code>.\n</p>\n');
          escape.ctx.type.should.equal('function');
          escape.ctx.name.should.equal('escape');
        });
      });
    });

    fixture('d.js', function(err, str){
      describe('test .parseComments() tags', function (){
        it('more tags', function(){
          var comments = dox.parseComments(str, {raw: true});
          var first = comments.shift();
          first.tags.should.have.length(4);
          first.description.full.should.equal('Parse tag type string "{Array|Object}" etc.\n');
          first.description.summary.should.equal('Parse tag type string "{Array|Object}" etc.\n');
          first.description.body.should.equal('');
          first.ctx.type.should.equal('method');
          first.ctx.receiver.should.equal('exports');
          first.ctx.name.should.equal('parseTagTypes');
          first.code.should.equal('exports.parseTagTypes = function(str) {\n  return str\n    .replace(/[{}]/g, \'\')\n    .split(/ *[|,\\/] */);\n};');

        });
      });
    });
    
    fixture('b.js', function(err, str){
      describe('test .parseComments() code', function(){
        it('test exports', function(){
          var comments = dox.parseComments(str)
            , version = comments.shift()
            , parse = comments.shift();

          version.code.should.equal("exports.version = '0.0.1';");
          parse.code.should.equal('exports.parse = function(str) {\n  return "wahoo";\n}');
        })
      });
    });

    fixture('titles.js', function(err, str){
      describe('test .parseComments() titles', function(){
        it('test titles', function(){
          var comments = dox.parseComments(str);
          comments[0].description.body.should.include('<h2>Some examples</h2>');
          comments[0].description.body.should.not.include('<h2>for example</h2>');
          comments[0].description.body.should.include('<h2>Some longer thing for example</h2>');
          
        });
      });
    });

    describe('test .parseCodeContext() function statement', function(){
      it('parses function statements correctly', function(){
        var ctx = dox.parseCodeContext('function foo(){\n\n}');
        ctx.type.should.equal('function');
        ctx.name.should.equal('foo');
      });
    });
    
    describe('test .parseCodeContext() function expression', function(){
      it('parses function assignment correctly', function(){
        var ctx = dox.parseCodeContext('var foo = function(){\n\n}');
        ctx.type.should.equal('function');
        ctx.name.should.equal('foo');
      });
    });
    
    describe('test .parseCodeContext() prototype method', function(){
      it('parses prototype methods correctly', function(){
        var ctx = dox.parseCodeContext('User.prototype.save = function(){}');
        ctx.type.should.equal('method');
        ctx.constructor.should.equal('User');
        ctx.name.should.equal('save');
      });
    });
    
    describe('test .parseCodeContext() prototype property', function(){
      it('parses prototypes correctly', function(){
        var ctx = dox.parseCodeContext('Database.prototype.enabled = true;\nasdf');
        ctx.type.should.equal('property');
        ctx.constructor.should.equal('Database');
        ctx.name.should.equal('enabled');
        ctx.value.should.equal('true');
      });
    });
    
    describe('test .parseCodeContext() method', function(){
      it('parses method declaration correctly', function(){
        var ctx = dox.parseCodeContext('user.save = function(){}');
        ctx.type.should.equal('method');
        ctx.receiver.should.equal('user');
        ctx.name.should.equal('save');
      });
    });
    
    describe('test .parseCodeContext() property', function(){
      it('parses property declaration correctly', function(){
        var ctx = dox.parseCodeContext('user.name = "tj";\nasdf');
        ctx.type.should.equal('property');
        ctx.receiver.should.equal('user');
        ctx.name.should.equal('name');
        ctx.value.should.equal('"tj"');
      });
    });
    
    describe('test .parseCodeContext() declaration', function(){
      it('parses var declaration correctly', function(){
        var ctx = dox.parseCodeContext('var name = "tj";\nasdf');
        ctx.type.should.equal('declaration');
        ctx.name.should.equal('name');
        ctx.value.should.equal('"tj"');
      });
    });

    describe('test .parseTag() @constructor', function(){
      it('parses constructor correctly', function(){
        var tag = dox.parseTag('@constructor');
        tag.type.should.equal('constructor');
      });
    });
    
    describe('test .parseTag() @see', function(){
      it('parses see correctly', function(){
        var tag = dox.parseTag('@see http://google.com');
        tag.type.should.equal('see');
        tag.title.should.equal('');
        tag.url.should.equal('http://google.com');
        
        var tag = dox.parseTag('@see Google http://google.com');
        tag.type.should.equal('see');
        tag.title.should.equal('Google');
        tag.url.should.equal('http://google.com');
        
        var tag = dox.parseTag('@see exports.parseComment');
        tag.type.should.equal('see');
        tag.local.should.equal('exports.parseComment');
      });
    });
    
    describe('test .parseTag() @api', function(){
      it('parses api correctly', function(){
        var tag = dox.parseTag('@api private');
        tag.type.should.equal('api');
        tag.visibility.should.equal('private');
      });
    });
    
    describe('test .parseTag() @type', function(){
      it('parses type correctly', function(){
        var tag = dox.parseTag('@type {String}');
        tag.type.should.equal('type');
        tag.types.should.eql(['String']);
      });
    });
    
    describe('test .parseTag() @param', function(){
      it('parses param correctly', function(){
        var tag = dox.parseTag('@param {String|Buffer}');
        tag.type.should.equal('param');
        tag.types.should.eql(['String', 'Buffer']);
        tag.name.should.equal('');
        tag.description.should.equal('');
      });
    });
    
    describe('test .parseTag() @return', function(){
      it('parses return correctly', function(){
        var tag = dox.parseTag('@return {String} a normal string');
        tag.type.should.equal('return');
        tag.types.should.eql(['String']);
        tag.description.should.equal('a normal string');
      });
    });

    describe('test .parseTag() @augments', function(){
      it('parses augments correctly', function(){
        var tag = dox.parseTag('@augments otherClass');
        tag.type.should.equal('augments');
        tag.otherClass.should.equal('otherClass')
      });
    });

    describe('test .parseTag() @author', function(){
      it('parses author correctly', function(){
        var tag = dox.parseTag('@author Bob Bobson');
        tag.type.should.equal('author');
        tag.string.should.equal('Bob Bobson');
      });
    });

    describe('test .parseTag() @borrows', function(){
      it('parses barrows members correctly', function(){
        var tag = dox.parseTag('@borrows foo as bar');
        tag.type.should.equal('borrows');
        tag.otherMemberName.should.equal('foo');
        tag.thisMemberName.should.equal('bar');
      });
    });

    describe('test .parseTag() @memberOf', function(){
      it('should regester parent as Foo.bar', function(){
        var tag = dox.parseTag('@memberOf Foo.bar')
        tag.type.should.equal('memberOf')
        tag.parent.should.equal('Foo.bar')
      });
    });
    
    describe('test .parseTag() default', function(){
      it('should parse arbitrary tags', function(){
        var tag = dox.parseTag('@hello universe is better than world');
        tag.type.should.equal('hello');
        tag.string.should.equal('universe is better than world');
      });
    });

    fixture('uncommented.js', function(err, str){
      describe('test .parseComments() code with no comments', function(){
        it('should parse code with no comments', function(){
          var comments = dox.parseComments(str)
            , all = comments.shift();
          all.code.should.equal("function foo() {\n  doSomething();\n}");
        })
      });
    });


    fixture('singleline.js', function(err, str){
      describe('test .parseComments() with a simple single line comment in code', function(){
        it('should parse single line comments', function(){
          var comments = dox.parseComments(str)
            , all = comments.shift();
          all.code.should.equal("function foo() {\n  // Maybe useful\n  doSomething();\n}");
        });
      });
    });
  });

  mocha.run();
});