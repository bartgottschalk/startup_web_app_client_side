start_tests = function () {
	QUnit.test("env_vars api_url test", function (assert) {
		window.startupwebapp.util.get_window_location_hostname = function() {return 'localliveservertestcase.startupwebapp.com'};
		var env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'http://localliveservertestcaseapi.startupwebapp.com:60767');

		window.startupwebapp.util.get_window_location_hostname = function() {return 'localhost.startupwebapp.com'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'http://localapi.startupwebapp.com:8000');

		window.startupwebapp.util.get_window_location_hostname = function() {return 'dev.startupwebapp.com'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'https://devapi.startupwebapp.com');

		window.startupwebapp.util.get_window_location_hostname = function() {return 'www.startupwebapp.com'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'https://api.startupwebapp.com');
	});	
}

$(document).ready(function() {
	start_tests();
});		

