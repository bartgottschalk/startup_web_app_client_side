start_tests = function () {
	QUnit.test("env_vars api_url test", function (assert) {
		// Test localhost environment (Docker Compose development)
		window.startupwebapp.util.get_window_location_hostname = function() {return 'localhost'};
		var env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'http://localhost:8000', 'localhost should route to http://localhost:8000');

		// Test frontend environment (Docker internal network)
		window.startupwebapp.util.get_window_location_hostname = function() {return 'frontend'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'http://backend:60767', 'frontend should route to http://backend:60767');

		// Test functional test environment
		window.startupwebapp.util.get_window_location_hostname = function() {return 'localliveservertestcase.startupwebapp.com'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'http://localliveservertestcaseapi.startupwebapp.com:60767', 'functional test env should route correctly');

		// Test legacy local development environment
		window.startupwebapp.util.get_window_location_hostname = function() {return 'localhost.startupwebapp.com'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'http://localapi.startupwebapp.com:8000', 'localhost.startupwebapp.com should route correctly');

		// Test dev environment
		window.startupwebapp.util.get_window_location_hostname = function() {return 'dev.startupwebapp.com'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'https://devapi.startupwebapp.com', 'dev environment should use HTTPS');

		// Test production environment
		window.startupwebapp.util.get_window_location_hostname = function() {return 'www.startupwebapp.com'};
		env_vars = $.env_vars();
		assert.equal(env_vars['api_url'], 'https://api.startupwebapp.com', 'production should route to HTTPS API');
	});
}

$(document).ready(function() {
	start_tests();
});		

