
var gitAPI = 'https://api.github.com/';

var grab = function(addr, callback, self){

}

var User = Backbone.Model.extend({
	
	initialize: function(){
		this.repos = new Repos;
	},

	fetch:function(){
		var self = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', gitAPI+'users/'+this.get('name')+'/repos', true);

		xhr.onload = function(e) {
			if (this.status == 200) {
				self.repos.reset(JSON.parse(this.response));
			}
		};

		xhr.send();
	}
});

var UserView = Backbone.View.extend({
	el: document.getElementById('repos'),

	initialize: function(){
		var self = this;
		this.model.repos.on('all', function(){self.render();});
	},

	events:{
		'change': 'update'
	},

	render:function(){
		var self = this;
		this.el.options.length = 1;
		this.model.repos.each(function(repo){
			self.el.options[self.el.options.length] = new Option(repo.get('name'), repo.cid);
		});
	},
	update: function(event){
		console.log(this.el.options[this.el.selectedIndex].value);
		var repo = this.model.repos.getByCid(this.el.options[this.el.selectedIndex].value);
		console.log(repo);
		var repoView = new RepoView({model: repo});
		repo.fetch();
	}
});

var Repo = Backbone.Model.extend({
	initialize: function(){
		this.files = new Files;
	},

	fetch:function(){
		var self = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.get('url')+'/contents', true);

		xhr.onload = function(e) {
			if (this.status == 200) {
				self.files.reset(JSON.parse(this.response));
			}
		};

		xhr.send();
	}
});

var RepoView = Backbone.View.extend({
	el: document.getElementById('files'),

	initialize: function(){
		var self = this;
		this.model.files.on('all', function(){self.render();});
	},

	events:{
		'change': 'update'
	},

	render:function(){
		var self = this;
		this.el.options.length = 1;
		this.model.files.each(function(file){
			self.el.options[self.el.options.length] = new Option(file.get('name'), file.cid);
		});
	},

	update: function(event){
		console.log(this.el.options[this.el.selectedIndex].value);
		var file = this.model.files.getByCid(this.el.options[this.el.selectedIndex].value);
		console.log(file);
		//window.updateCode(file.get('git_url'));
		var element = angular.element('<dox src-path='+file.get('git_url')+'></dox>');
		console.log(element)
		var docs = document.getElementById('docs');
		docs.innerHTML = null;
		$(docs).append(element);
		angular.bootstrap( element, ['components']);
		//file.fetch();
	}
});

var Repos = Backbone.Collection.extend({
	model:Repo
});

var File = Backbone.Model.extend({
	initialize: function() {
	},

	fetch: function(){
		var self = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.get('git_url'), true);
		xhr.setRequestHeader('Accept', 'application/vnd.github-blob.raw');
		xhr.onload = function(e) {
			if (this.status == 200) {
				
				var content = this.response;
				self.set({'content': content});
			}
		};

		xhr.send();
	}
});

var Files = Backbone.Collection.extend({
	model:File
});

var user = new User;
var userView = new UserView({model: user});

var App = Backbone.View.extend({
	el: $('#app'),

	template: _.template(''),

	events: {
		"keypress": "render",
                "blur": "update"
	},

	initialize: function(){

	},
	render: function(e){
		if (e.keyCode != 13) return;
      	if (!this.el.value) return;
         This.update()
	},
        update:function(){
           user.set('name', this.el.value);
		user.fetch();
         }
});

var app = new App;

