
function doxControl($scope){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', document.getElementById('dox-angular').getAttribute('data-src'), true);
	$scope.obj = {}
	xhr.onload = function(e) {
		if (this.status == 200) {
		  var result = dox.parseComments(this.response);
		  console.log(result);
		  var testResult = _.groupBy(result, function(thing){
		  	console.log(thing);
		  	if(thing.ctx !== undefined) {
		  		return thing.ctx.type;
		  	} else {
		  		return 'code';
		  	}
		  });
		  var functions = {};
		  _.each(testResult.function, function(fn){
		  	functions[fn.ctx.name] = fn;
		  });

		  _.each(functions, function(fn){
		  	fn.prototypeMethods = _.filter(testResult.method, function(met){return met.ctx.cons == fn.ctx.name});
		  	fn.prototypeProperty = _.filter(testResult.property, function(met){return met.ctx.cons == fn.ctx.name});
		  	fn.methods = _.filter(testResult.method, function(met){return met.ctx.receiver == fn.ctx.name});
		  	fn.properties = _.filter(testResult.property, function(met){return met.ctx.receiver == fn.ctx.name});
		  });

		  testResult.functions = functions;

		  var docs = {raw: result, jsDoc: testResult};

		  console.log(docs.jsDoc.functions);
		  //console.log(JSON.stringify(result, null, 2));
		  $scope.$apply(function(){
	          $scope.obj = docs;

	          setTimeout(function(){Rainbow.color();}, 1000);
	      });


		  //console.log($scope.obj);
		}
	};

    $scope.notReserved = function(item){
        return item.type != 'param' && item.type != 'return';
    }

    $scope.hasParams = function(item){
    	for(var i in item.tags){
    		if(item.tags[i].type == 'param'){
    			return true;
    		}
    	}
    	return false;
    }

    $scope.doesReturn = function(item){
    	for(var i in item.tags){
    		if(item.tags[i].type == 'return'){
    			return true;
    		}
    	}
    	return false;
    }

	xhr.send();
}