(function(){
	xtag.register('x-mneme', {
		mixins: ['request'],
		onCreate: function(){
			this.mneme = new Mneme();
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
		    	this.mneme.parse(code);
		    	console.log(this.mneme);
		    	this.update();
		    },
		    compile: function(src){
		    	var source = document.getElementById(src).innerHTML;
					this.template = Handlebars.compile(source);
		    },
		    update: function(){
		    	this.innerHTML = this.template(this.mneme);
		    	hljs.initHighlighting();
		    }
		}
	});
})();