(function(){

	var cleanDox = function(code){
		var raw = dox.parseComments(code);
		var result = _.groupBy(raw, function(thing){
			if(thing.ctx !== undefined) {
				return thing.ctx.type;
			} else {
				return 'code';
			}
		});

		var functions = {};
		_.each(result.function, function(fn){
			functions[fn.ctx.name] = fn;
		});

		_.each(functions, function(fn){
			fn.prototypeMethods = _.filter(result.method, function(met){return met.ctx.cons == fn.ctx.name});
			fn.prototypeProperty = _.filter(result.property, function(met){return met.ctx.cons == fn.ctx.name});
			fn.methods = _.filter(result.method, function(met){return met.ctx.receiver == fn.ctx.name});
			fn.properties = _.filter(result.property, function(met){return met.ctx.receiver == fn.ctx.name});
		});

		result.functions = functions;

		var declarations = {};
		_.each(result.declaration, function(dec){
			declarations[dec.ctx.name] = dec;
		});

		_.each(declarations, function(dec){
			dec.prototypeMethods = _.filter(result.method, function(met){return met.ctx.cons == dec.ctx.name});
			dec.prototypeProperty = _.filter(result.property, function(met){return met.ctx.cons == dec.ctx.name});
			dec.methods = _.filter(result.method, function(met){return met.ctx.receiver == dec.ctx.name});
			dec.properties = _.filter(result.property, function(met){return met.ctx.receiver == dec.ctx.name});
		});

		result.declarations = declarations;

		var docs = {raw: raw, jsDoc: result};
		return docs;
	};

	xtag.register('x-dox', {
		mixins: ['request'],
		onCreate: function(){
		    // fired once at the time a component 
		    // is initially created or parsed
		    this.dataready = this.dataready || function(request){
				this.code = request.responseText;
			}
		},
		onInsert: function(){
		    // fired each time a component 
		    // is inserted into the DOM
		    this.templateSrc = this.getAttribute('template-src');
		},
		events: {
		    
		},
		getters: {
		    
		},
		setters: {
			code: function(code){
		        if (code){
		          	this.parse(code);
		        }
		     },
		     templateSrc: function(value){
		     	if(value){
					this.compile(value);
		     	}
		     }
		    // Add DOM object setters
		},
		methods: {
		    parse: function(code){
		    	this.dox = cleanDox(code);
		    	console.log(this.dox);
		    	this.update();
		    },
		    compile: function(src){
		    	var source = document.getElementById(src).innerHTML;
				this.template = Handlebars.compile(source);
				console.log(this.template);
		    },
		    update: function(){
		    	this.innerHTML = this.template(this.dox.jsDoc);
		    	hljs.initHighlighting();
		    }
		}
	});
})();