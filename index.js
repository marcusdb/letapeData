var casper = require('casper').create({
    verbose: true,
    logLevel: "error"
});
//ctl00_ctl42_g_9fd6ac63_e959_43d9_a1f4_d5bb5ff69b82_btnBuscar
var site = 'http://www.letapebrasil.com.br/inscricao/Paginas/resultados.aspx';
var data = {};

var people = [];

var getData = function getData() {	
	var rowsArray = [];
	var rows = $('#ctl00_ctl42_g_9fd6ac63_e959_43d9_a1f4_d5bb5ff69b82_dgdMain tr');
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
	
	return rowsArray

}

var check = function check() {
	//return this.exists('#ctl00_ctl42_g_9fd6ac63_e959_43d9_a1f4_d5bb5ff69b82_btnBuscar');
	return this.exists('#aspnetForm');
};

var recurr = function recurr(casper, page) {
	
	casper.waitFor(check);
	
	casper.fill('form#aspnetForm', {
		__EVENTTARGET:'ctl00$ctl42$g_9fd6ac63_e959_43d9_a1f4_d5bb5ff69b82$dgdMain',
		__EVENTARGUMENT:'Page$' + page
	}, true);
	casper.wait(10000);	
	casper.then(function() {
		
		var ret=this.evaluate(getData);
		
		//casper.echo('Navigated to page ' + page+' ret'+ret, 'INFO');
		
		data.body=data.body.concat(ret);
		page = page + 1;
		if (page < 36) {
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

	this.evaluate(function() {
		$('#ctl00_ctl42_g_9fd6ac63_e959_43d9_a1f4_d5bb5ff69b82_btnBuscar').click();
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