start_tests = function () {
	// ===== Environment Detection Tests =====
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

	// ===== Form Validation Tests =====
	QUnit.test("Email validation", function (assert) {
		// Valid emails
		assert.ok($.isEmail('test@example.com'), 'test@example.com should be valid');
		assert.ok($.isEmail('user.name+tag@example.co.uk'), 'user.name+tag@example.co.uk should be valid');
		assert.ok($.isEmail('test_123@test-domain.com'), 'test_123@test-domain.com should be valid');

		// Invalid emails
		assert.notOk($.isEmail('notanemail'), 'notanemail should be invalid');
		assert.notOk($.isEmail('missing@domain'), 'missing@domain should be invalid');
		assert.notOk($.isEmail('@example.com'), '@example.com should be invalid');
		assert.notOk($.isEmail('test@'), 'test@ should be invalid');
	});

	QUnit.test("isAlpha validation", function (assert) {
		assert.ok($.isAlpha('abc'), 'abc should be valid');
		assert.ok($.isAlpha('ABC'), 'ABC should be valid');
		assert.ok($.isAlpha(''), 'empty string should be valid');
		assert.notOk($.isAlpha('abc123'), 'abc123 should be invalid');
		assert.notOk($.isAlpha('abc '), 'abc with space should be invalid');
	});

	QUnit.test("isNumeric validation", function (assert) {
		assert.ok($.isNumeric('123'), '123 should be valid');
		assert.ok($.isNumeric('0'), '0 should be valid');
		assert.ok($.isNumeric(''), 'empty string should be valid');
		assert.notOk($.isNumeric('123a'), '123a should be invalid');
		assert.notOk($.isNumeric('12.3'), '12.3 should be invalid');
	});

	QUnit.test("isAlphaNumeric validation", function (assert) {
		assert.ok($.isAlphaNumeric('abc123'), 'abc123 should be valid');
		assert.ok($.isAlphaNumeric('ABC'), 'ABC should be valid');
		assert.ok($.isAlphaNumeric('123'), '123 should be valid');
		assert.notOk($.isAlphaNumeric('abc 123'), 'abc 123 with space should be invalid');
		assert.notOk($.isAlphaNumeric('abc-123'), 'abc-123 with hyphen should be invalid');
	});

	QUnit.test("Password validation", function (assert) {
		// Valid password
		var validPassword = 'TestPass123!';
		var errors = $.isPasswordValid(validPassword, 150);
		assert.equal(errors.length, 0, 'Valid password should have no errors');

		// Too short
		errors = $.isPasswordValid('Test1!', 150);
		assert.ok(errors.length > 0, 'Short password should have errors');
		assert.ok(errors.some(function(e) { return e.type === 'too_short'; }), 'Should have too_short error');

		// No capital letter
		errors = $.isPasswordValid('testpass123!', 150);
		assert.ok(errors.some(function(e) { return e.type === 'no_capital_letter'; }), 'Should have no_capital_letter error');

		// No special character
		errors = $.isPasswordValid('TestPass123', 150);
		assert.ok(errors.some(function(e) { return e.type === 'no_special_character'; }), 'Should have no_special_character error');

		// Empty password
		errors = $.isPasswordValid('', 150);
		assert.ok(errors.some(function(e) { return e.type === 'required'; }), 'Empty password should have required error');
	});

	QUnit.test("Username validation", function (assert) {
		// Valid username
		var errors = $.isUserNameValid('test_user-123', 150);
		assert.equal(errors.length, 0, 'Valid username should have no errors');

		// Too short
		errors = $.isUserNameValid('test', 150);
		assert.ok(errors.some(function(e) { return e.type === 'too_short'; }), 'Should have too_short error');

		// Invalid characters
		errors = $.isUserNameValid('test user', 150);
		assert.ok(errors.some(function(e) { return e.type === 'not_valid'; }), 'Spaces should be invalid');

		// Empty
		errors = $.isUserNameValid('', 150);
		assert.ok(errors.some(function(e) { return e.type === 'required'; }), 'Empty username should have required error');
	});

	// ===== Cookie Tests (includes deprecated jQuery.trim()) =====
	QUnit.test("getCookie function", function (assert) {
		// Test with no cookies
		document.cookie = '';
		assert.equal($.getCookie('test'), null, 'Should return null when cookie does not exist');

		// Test with single cookie
		$.setCookie('testcookie', 'testvalue', 1);
		assert.equal($.getCookie('testcookie'), 'testvalue', 'Should retrieve cookie value');

		// Test with multiple cookies (exercises jQuery.trim())
		$.setCookie('cookie1', 'value1', 1);
		$.setCookie('cookie2', 'value2', 1);
		assert.equal($.getCookie('cookie1'), 'value1', 'Should retrieve first cookie');
		assert.equal($.getCookie('cookie2'), 'value2', 'Should retrieve second cookie');

		// Clean up
		$.setCookie('testcookie', '', -1);
		$.setCookie('cookie1', '', -1);
		$.setCookie('cookie2', '', -1);
	});

	// ===== Cart Counter Tests =====
	QUnit.test("set_cart_item_counter generates correct HTML", function (assert) {
		// Setup
		$('#qunit-fixture').append('<div id="header-shopping-cart"></div>');

		// Test with 0 items
		$.set_cart_item_counter(0);
		var element = $('#cart-item-count-wrapper');
		assert.ok(element.length > 0, 'Cart counter element should exist');
		assert.equal(element.text(), '0', 'Should display 0');
		assert.equal(element.attr('title'), 'You have no items in your cart.', 'Should have correct title for 0 items');
		assert.ok(element.hasClass('cart-item-count-wrapper-single-digit'), 'Should have single-digit class');

		// Test with 1 item
		$.set_cart_item_counter(1);
		element = $('#cart-item-count-wrapper');
		assert.equal(element.text(), '1', 'Should display 1');
		assert.equal(element.attr('title'), 'You have 1 item in your cart.', 'Should have correct title for 1 item');

		// Test with multiple items (single digit)
		$.set_cart_item_counter(5);
		element = $('#cart-item-count-wrapper');
		assert.equal(element.text(), '5', 'Should display 5');
		assert.equal(element.attr('title'), 'You have 5 items in your cart.', 'Should have correct title for multiple items');
		assert.ok(element.hasClass('cart-item-count-wrapper-single-digit'), 'Should have single-digit class');

		// Test with double digit
		$.set_cart_item_counter(15);
		element = $('#cart-item-count-wrapper');
		assert.equal(element.text(), '15', 'Should display 15');
		assert.equal(element.attr('title'), 'You have 15 items in your cart.', 'Should have correct title for 15 items');
		assert.ok(element.hasClass('cart-item-count-wrapper-double-digit'), 'Should have double-digit class');
	});

	// ===== URL Parameter Tests =====
	QUnit.test("urlParam function", function (assert) {
		// Save original location
		var originalLocation = window.location.href;

		// Mock window.location.href
		var mockURL = 'http://example.com/page?param1=value1&param2=value2&param3=';
		Object.defineProperty(window, 'location', {
			writable: true,
			value: { href: mockURL }
		});

		assert.equal($.urlParam('param1'), 'value1', 'Should extract param1');
		assert.equal($.urlParam('param2'), 'value2', 'Should extract param2');
		assert.equal($.urlParam('param3'), 0, 'Should return 0 for empty param');
		assert.equal($.urlParam('nonexistent'), null, 'Should return null for non-existent param');

		// Restore original location
		Object.defineProperty(window, 'location', {
			writable: true,
			value: { href: originalLocation }
		});
	});

	// ===== Array Utility Tests =====
	QUnit.test("are_arrays_equal function", function (assert) {
		assert.ok($.are_arrays_equal([1,2,3], [1,2,3]), 'Identical arrays should be equal');
		assert.ok($.are_arrays_equal([], []), 'Empty arrays should be equal');
		assert.ok($.are_arrays_equal(['a','b'], ['a','b']), 'String arrays should be equal');
		assert.notOk($.are_arrays_equal([1,2,3], [1,2,4]), 'Different values should not be equal');
		assert.notOk($.are_arrays_equal([1,2], [1,2,3]), 'Different lengths should not be equal');
	});

	// ===== Variable Scope Tests (ESLint Bug Detection) =====
	QUnit.test("display_errors does not pollute global scope with loop variable", function (assert) {
		// Setup
		$('#qunit-fixture').append('<div id="test-form"></div>');
		$('#qunit-fixture').append('<div id="test-form-error"></div>');

		// Ensure 'i' is not defined globally before the test
		assert.strictEqual(typeof window.i, 'undefined', 'Variable i should not be defined globally before test');

		// Call the function that has a for loop
		var errors = [
			{type: 'error1', description: 'First error'},
			{type: 'error2', description: 'Second error'},
			{type: 'error3', description: 'Third error'}
		];
		var errorMessageDiv = $('#test-form-error');
		var errorField = $('#test-form');
		$.display_errors(errors, errorMessageDiv, errorField, 'test-form', false, 'error-class', 'error-div-class');

		// Verify the function worked correctly
		var errorList = $('#test-form-error-ul li');
		assert.equal(errorList.length, 3, 'Should display 3 error messages');
		assert.equal($(errorList[0]).text(), 'First error', 'First error should be displayed');
		assert.equal($(errorList[2]).text(), 'Third error', 'Third error should be displayed');

		// Critical test: verify 'i' did not leak to global scope
		assert.strictEqual(typeof window.i, 'undefined', 'Variable i should not be defined globally after for loop');
	});
}

$(document).ready(function() {
	start_tests();
});		

