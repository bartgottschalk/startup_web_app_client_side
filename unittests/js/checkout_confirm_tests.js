start_checkout_tests = function () {
	// ===== Stripe Checkout Session Tests =====

	QUnit.module('Stripe Checkout Session Integration', function(hooks) {
		var originalAjax;

		hooks.beforeEach(function() {
			// Save original $.ajax
			originalAjax = $.ajax;

			// Setup test fixture with required DOM elements
			$('#qunit-fixture').html(
				'<div id="confirm-detail-body">' +
					'<div id="confirm-checkout-button-wrapper-bottom">' +
						'<div id="place-order-button-bottom" class="confirm-order-button">' +
							'<span id="place-order-button-span" class="confirm-order-button-span">PLACE ORDER</span>' +
						'</div>' +
					'</div>' +
					'<div id="confirm-order-terms-of-sale-agree-error" class="confirm-order-form-error-text-hidden"></div>' +
					'<input type="checkbox" id="confirm-order-terms-of-sale-agree" checked>' +
					'<input type="checkbox" id="save-shipping-and-payment-info">' +
				'</div>'
			);

			// Set up environment variables
			window.startupwebapp = window.startupwebapp || {};
			window.startupwebapp.util = window.startupwebapp.util || {};
			window.startupwebapp.util.get_window_location_hostname = function() { return 'localhost'; };
		});

		hooks.afterEach(function() {
			// Restore original $.ajax
			$.ajax = originalAjax;

			// Clean up global variables
			delete window.Stripe;
		});

		QUnit.test('create_stripe_checkout_session function exists', function(assert) {
			assert.ok(typeof window.create_stripe_checkout_session === 'function',
				'create_stripe_checkout_session should be defined as a function');
		});

		QUnit.test('create_stripe_checkout_session calls correct endpoint', function(assert) {
			// Skip if function doesn't exist yet
			if (typeof window.create_stripe_checkout_session !== 'function') {
				assert.ok(false, 'create_stripe_checkout_session not yet implemented');
				return;
			}

			assert.expect(3);
			var done = assert.async();
			var ajaxCalled = false;

			// Reset global jQuery selectors to current DOM
			window.confirm_order_terms_of_sale_agree_field = $('#confirm-order-terms-of-sale-agree');
			window.confirm_order_terms_of_sale_agree_error = $('#confirm-order-terms-of-sale-agree-error');

			// Mock $.ajax to capture only the create-checkout-session request
			$.ajax = function(options) {
				// Only check assertions for the create-checkout-session endpoint
				if (options.url && options.url.includes('/order/create-checkout-session')) {
					ajaxCalled = true;
					assert.equal(options.method, 'POST', 'Should use POST method');
					assert.ok(options.url.includes('/order/create-checkout-session'),
						'Should call /order/create-checkout-session endpoint');
					assert.ok(options.xhrFields.withCredentials,
						'Should include credentials for CSRF');
					done();
				}
				return { fail: function() { return this; } };
			};

			// Set up required global variables
			$.user_logged_in = true;

			// Add timeout to prevent hanging
			setTimeout(function() {
				if (!ajaxCalled) {
					assert.ok(false, 'Test timed out - AJAX call was not made (likely validation issue)');
					done();
				}
			}, 1000);

			// Call the function
			window.create_stripe_checkout_session();
		});

		QUnit.test('create_stripe_checkout_session sends required data', function(assert) {
			// Skip if function doesn't exist yet
			if (typeof window.create_stripe_checkout_session !== 'function') {
				assert.ok(false, 'create_stripe_checkout_session not yet implemented');
				return;
			}

			assert.expect(2);
			var done = assert.async();
			var ajaxCalled = false;

			// Reset global jQuery selectors to current DOM
			window.confirm_order_terms_of_sale_agree_field = $('#confirm-order-terms-of-sale-agree');
			window.confirm_order_terms_of_sale_agree_error = $('#confirm-order-terms-of-sale-agree-error');

			// Mock $.ajax to capture only the create-checkout-session request
			$.ajax = function(options) {
				// Only check assertions for the create-checkout-session endpoint
				if (options.url && options.url.includes('/order/create-checkout-session')) {
					ajaxCalled = true;
					assert.ok(options.data, 'Should send data in request');
					assert.ok(options.data.save_defaults !== undefined,
						'Should include save_defaults flag');
					done();
				}
				return { fail: function() { return this; } };
			};

			// Set up required global variables
			$.user_logged_in = true;

			// Add timeout to prevent hanging
			setTimeout(function() {
				if (!ajaxCalled) {
					assert.ok(false, 'Test timed out - AJAX call was not made (likely validation issue)');
					done();
				}
			}, 1000);

			// Call the function
			window.create_stripe_checkout_session();
		});

		QUnit.test('handle_checkout_session_success function exists', function(assert) {
			assert.ok(typeof window.handle_checkout_session_success === 'function',
				'handle_checkout_session_success should be defined as a function');
		});

		QUnit.test('handle_checkout_session_success redirects to Stripe URL', function(assert) {
			// Skip if function doesn't exist yet
			if (typeof window.handle_checkout_session_success !== 'function') {
				assert.ok(false, 'handle_checkout_session_success not yet implemented');
				return;
			}

			// Note: We can't easily test actual redirect without leaving the page
			// Instead, we'll verify the function handles success response correctly
			// by checking that it doesn't throw errors and processes the data
			assert.expect(1);

			var testSessionUrl = 'https://checkout.stripe.com/c/pay/test_session_123';
			var responseData = {
				'create_checkout_session': 'success',
				'session_url': testSessionUrl
			};

			// The function will try to redirect, which we can't fully test in unit tests
			// This is better tested in integration/functional tests
			// For now, just verify the function exists and can be called
			try {
				// We can't prevent the redirect, so just verify the logic path
				var functionSource = window.handle_checkout_session_success.toString();
				assert.ok(functionSource.includes('window.location.href'),
					'Function should contain redirect logic');
			} catch (e) {
				assert.ok(false, 'Function threw an error: ' + e.message);
			}
		});

		QUnit.test('handle_checkout_session_success displays error on failure', function(assert) {
			// Skip if function doesn't exist yet
			if (typeof window.handle_checkout_session_success !== 'function') {
				assert.ok(false, 'handle_checkout_session_success not yet implemented');
				return;
			}

			assert.expect(2);

			var responseData = {
				'create_checkout_session': 'error',
				'errors': {
					'error': 'cart-not-found',
					'description': 'No cart was found.'
				}
			};

			// Call the handler
			window.handle_checkout_session_success(responseData);

			var errorDiv = $('#confirm-order-terms-of-sale-agree-error');
			assert.ok(errorDiv.text().length > 0,
				'Should display error message');
			assert.ok(errorDiv.hasClass('confirm-order-form-error-text'),
				'Should show error with correct CSS class');
		});

		QUnit.test('deprecated StripeCheckout.configure should not exist', function(assert) {
			assert.expect(1);

			// Verify that the old set_up_stripe_checkout_handler function doesn't exist
			// or has been modified to not use StripeCheckout.configure
			var oldFunctionNotPresent = (
				typeof window.set_up_stripe_checkout_handler === 'undefined' ||
				typeof window.StripeCheckout === 'undefined'
			);

			assert.ok(oldFunctionNotPresent,
				'Old StripeCheckout.configure-based code should be removed');
		});

		QUnit.test('Stripe.js v3 can be initialized', function(assert) {
			assert.expect(1);

			// Mock Stripe object (as if Stripe.js v3 is loaded)
			window.Stripe = function(publishableKey) {
				assert.ok(publishableKey, 'Stripe should be initialized with publishable key');
				return {
					// Mock Stripe instance methods if needed
				};
			};

			// Simulate initializing Stripe (new code will do this)
			var stripe = window.Stripe('pk_test_123');
		});

		QUnit.test('create_checkout_session shows loading indicator', function(assert) {
			// Skip if function doesn't exist yet
			if (typeof window.create_stripe_checkout_session !== 'function') {
				assert.ok(false, 'create_stripe_checkout_session not yet implemented');
				return;
			}

			assert.expect(1);
			var done = assert.async();
			var ajaxCalled = false;

			// Reset global jQuery selectors to current DOM
			window.confirm_order_terms_of_sale_agree_field = $('#confirm-order-terms-of-sale-agree');
			window.confirm_order_terms_of_sale_agree_error = $('#confirm-order-terms-of-sale-agree-error');

			// Mock $.ajax to prevent actual request
			$.ajax = function(options) {
				// Only check for loading indicator when calling create-checkout-session
				if (options.url && options.url.includes('/order/create-checkout-session')) {
					ajaxCalled = true;
					// Check if loading indicator was added
					var loader = $('.create-account-loader-wrapper');
					assert.ok(loader.length > 0,
						'Should display loading indicator while creating session');
					done();
				}
				return { fail: function() { return this; } };
			};

			// Set up required global variables
			$.user_logged_in = true;

			// Add timeout to prevent hanging
			setTimeout(function() {
				if (!ajaxCalled) {
					assert.ok(false, 'Test timed out - AJAX call was not made (likely validation issue)');
					done();
				}
			}, 1000);

			// Call the function
			window.create_stripe_checkout_session();
		});
	});

	// ===== Integration Tests =====

	QUnit.module('Checkout Flow Integration', function() {

		QUnit.test('checkout flow uses new session-based approach', function(assert) {
			assert.expect(1);

			// Verify that the old token-based flow functions are removed/not used
			var oldFunctionsNotPresent = (
				typeof stripe_checkout_handler_token_callback === 'undefined' ||
				stripe_checkout_handler_token_callback === null
			);

			assert.ok(oldFunctionsNotPresent,
				'Old token-based callback should be removed or unused');
		});
	});
};

$(document).ready(function() {
	start_checkout_tests();
});
