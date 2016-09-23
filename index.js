

var casper = require('casper').create({
    verbose: true,
    logLevel: "debug"
});
var utils = require('utils');



var casper = require('casper').create();

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
})
casper.options.onResourceRequested = function(C, requestData, request) {
    if(requestData.method==='POST'){
        console.log('POST!!'+requestData.url);
        //utils.dump(requestData);
    }
    
};
// casper.options.onResourceReceived = function(C, response) {
//     utils.dump(response.headers);
// };
//ctl00_ctl42_g_9fd6ac63_e959_43d9_a1f4_d5bb5ff69b82_btnBuscar
var site = 'http://www.letapebrasil.com.br/resultados/Paginas/Resultados2016.aspx';
var data = {body:''};

var people = [];

var getData = function getData() {
    
	var rowsArray = [];
	var rows = $('#ctl00_ctl42_g_dc9df451_45a8_4d13_a524_97cae946da43_dgdMain tr');
 
	rows.each(function(el) {
		rowsArray.push(el);
	});

	var header = rowsArray[0];
	//rowsArray.shift();



	rowsArray = Array.prototype.map.call(rows, function(row) {
		//return $(row).children('td').length;
		return Array.prototype.map.call($(row).children('td'), function(it) {
			return $(it).text();
		});
	});
	rowsArray.shift();
	rowsArray.pop();
	rowsArray.pop();
    //console.log(rowsArray);
	return rowsArray

}

var check = function check() {
    //console.log('CHECK:'+this.exists('#aspnetForm'));
	//return this.exists('#ctl00_ctl42_g_9fd6ac63_e959_43d9_a1f4_d5bb5ff69b82_btnBuscar');
	return this.exists('#aspnetForm');
};

var recurr = function recurr(casper, page) {
	casper.echo('recurr called ');
    
    
	casper.waitFor(check);
	casper.evaluate(function(page){
        console.log('POST BACK');
        __doPostBack('ctl00$ctl42$g_dc9df451_45a8_4d13_a524_97cae946da43$dgdMain','Page$'+page);
    },{page:page});
	// casper.fill('form#aspnetForm', {
	// 	__EVENTTARGET:'ctl00$ctl42$g_dc9df451_45a8_4d13_a524_97cae946da43$dgdMain',
	// 	__EVENTARGUMENT:'Page$' + page
	// }, true);
	casper.wait(500);	
    
	casper.then(function() {
		console.log('Navigated to page ' + page+' ret'+ret, 'INFO');
		var ret=this.evaluate(getData);
		
		//casper.echo('Navigated to page ' + page+' ret'+ret, 'INFO');
		
		data.body=data.body.concat(ret);
		page = page + 1;
		if (page < 62) {
			recurr(casper, page)
		}

	});
	 
	// casper.waitFor(check, function() {
		
	// 	var ret=this.evaluate(getData);
		
	// 	casper.echo('Navigated to page ' + page, 'INFO');
		
	// 	data.body=data.body.concat(ret);
	// 	page = page + 1;
	// 	if (page < 6) {
	// 		recurr(casper, page)
	// 	}

	// });
}

casper.start(site, function() {
    this.waitForSelector('#ctl00_ctl42_g_dc9df451_45a8_4d13_a524_97cae946da43_btnBuscar');
});

casper.then(function() {
    
    this.evaluate(function(){
        $('#ctl00_ctl42_g_dc9df451_45a8_4d13_a524_97cae946da43_btnBuscar').click()
    });
	
});



casper.waitFor(check,
	function then() { // step to execute when check() is ok
		//this.echo('Navigated to page 1', 'INFO');
		var _this = this;
		
		data.body = this.evaluate(getData);
		
		
		recurr(this, 2);
	},
	function timeout() { // step to execute if check has failed
		this.echo('Failed to navigate to page 2', 'ERROR');
	});

// casper.then(function() {

// });

casper.run(function() {
	this.echo(JSON.stringify(data.body));
	this.exit();
});