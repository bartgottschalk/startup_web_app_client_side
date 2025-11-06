var csrftoken;
var token_retried = false;
var env_vars = $.env_vars();
var email_verification_code;
var email_verified;
var stripe_checkout_handler = null;
var stripe_payment_token = null;
var stripe_payment_args = null;

$(document).ready(function() {
	//console.log(env_vars);
	
	$.ajax({
		method: "GET",
		url: env_vars['api_url'] + "/user/account-content",
		dataType: "json",
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_account
	})
	.fail(function() {
	    //console.log('get account_content failed');
		$.log_client_event('ajaxerror', 'account-account-content');
		$.display_page_fatal_error('my-account-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
	});
});

load_token = function( data ) {
	csrftoken = $.getCookie('csrftoken');
	if ($.urlParam('email_verification_code') != null && email_verified == false) {
		email_verification_code = $.urlParam('email_verification_code');
		//console.log(email_verification_code);
		verify_email_address_response();
	}
}

load_account = function( data, textStatus, xhr ) {
	//console.log(data);

	if (data['account_content']['authenticated'] == 'true') {
		if ($.urlParam('message') != null) {
			//console.log($.urlParam('message'));
			switch ($.urlParam('message')) {
		        case 'password-updated':
					$("#my-account-general-notification").append('Your account password has been changed. You will now be able to login with your new password.');
					break;
			}
		}		

		var newsletter_subscriber_str = 'No';
		if (data['account_content']['personal_data']['newsletter_subscriber']) {
			newsletter_subscriber_str = 'Yes';
		}

		var email_unsubscribed_str = 'No';
		//console.log(data['account_content']['personal_data']['email_unsubscribed']);
		if (data['account_content']['personal_data']['email_unsubscribed']) {
			email_unsubscribed_str = 'Yes <span class="account-my-information-note">(Please note that ' + data['account_content']['email_data']['email_address'] + ' may still recieve operational messages from StartupWebApp if you use this email address for orders, subscriptions or similar activities.)</div>';
		}

		email_verified = data['account_content']['email_data']['email_verified'];
		var email_verified_str = 'No';
		var verify_email_button = '<div class="verify-email-button-wrapper"><input id="verify-email-address" type="submit" class="verify-email-button" value="Send New Verification Code"/></div>';
		if (email_verified) {
			email_verified_str = 'Yes';
			verify_email_button = '';
		}
		//console.log(data['account_content']['email_data']['verification_request_sent_within_24_hours']);
		var email_verification_sent_str = '';
		if (data['account_content']['email_data']['verification_request_sent_within_24_hours']) {
			email_verification_sent_str = ' <span id="email-verify-recently-sent-message" class="account-my-information-note">(A verification email was recently sent to your email address. If you haven\'t received it please check your Spam and Junk folders.)</span>';
		}

		var joined_date = new Date(data['account_content']['personal_data']['joined_date_time']);
		var last_login_date = new Date(data['account_content']['personal_data']['last_login_date_time']);
		if (data['account_content']['personal_data']['terms_of_use_agreed_date_time'] == null) {
			var terms_of_use_agreed_date = 'NA';			
		}
		else {
			var terms_of_use_agreed_date = new Date(data['account_content']['personal_data']['terms_of_use_agreed_date_time']);			
		}


		$(".section-title").removeClass('hide');
		$("#my-food-card-library-sub-header").removeClass('hide');
		$("#my-information-sub-header").removeClass('hide');
		$("#my-shipping-billing-address-payment-info-sub-header").removeClass('hide');
		$("#my-communication-preferences-sub-header").removeClass('hide');
		$("#my-password-sub-header").removeClass('hide');
		$("#my-orders-sub-header").removeClass('hide');

		$("#account-info").append('<div class="account-item"><div class="account-change-password-wrapper"><a href="/account/edit-my-information">Edit My Information</a></div></div>');
		$("#account-info").append('<div class="account-item"><span class="account-my-information-label">Username</span>: <span class="account-my-information-value">' + data['account_content']['personal_data']['username'] + '</span></div>');
		$("#account-info").append('<div class="account-item"><span class="account-my-information-label">Name</span>: <span class="account-my-information-value">' + data['account_content']['personal_data']['first_name'] + ' ' + data['account_content']['personal_data']['last_name']  + '</span></div>');
		$("#account-info").append('<div class="account-item"><span class="account-my-information-label">Email Address</span>: <span class="account-my-information-value">' + data['account_content']['email_data']['email_address'] + '</span></div>');
		$("#account-info").append('<div id="verify-email" class="account-item"><span class="account-my-information-label">Email Verified</span>: <span id="email-verified-value" class="account-my-information-value">' + email_verified_str + '</span>' + verify_email_button + email_verification_sent_str + '</div>');


		stripe_payment_token = data['account_content']['shipping_billing_addresses_and_payment_data']['token'];
		stripe_payment_args = data['account_content']['shipping_billing_addresses_and_payment_data']['args'];
		display_payment_data();
		set_up_stripe_checkout_handler(data['account_content']['email_data']['email_address'], data['account_content']['stripe_publishable_key']);

		$("#communication-preferences-info").append('<div class="account-item"><div class="account-change-password-wrapper"><a href="/account/edit-communication-preferences">Edit Communication Preferences</a></div></div>');
		$("#communication-preferences-info").append('<div class="account-item"><span class="account-my-information-label">Unsubscribed from Newsletters and Marketing Communication</span>: <span class="account-my-information-value">' + email_unsubscribed_str + '</span></div>');
		$("#communication-preferences-info").append('<div class="account-item"><span class="account-my-information-label">Newsletter Subscription</span>: <span class="account-my-information-value">' + newsletter_subscriber_str + '</span></div>');
		$("#account-info").append('<div class="account-item"><span class="account-my-information-label">Joined Date/Time</span>: <span class="account-my-information-value">' + joined_date + '</span></div>');
		$("#account-info").append('<div class="account-item"><span class="account-my-information-label">Last Login Date/Time</span>: <span class="account-my-information-value">' + last_login_date + '</span></div>');
		$("#account-info").append('<div class="account-item"><span class="account-my-information-label">Terms of Use and Privacy Policy Agreed Date/Time</span>: <span class="account-my-information-value">' + terms_of_use_agreed_date + '</span></div>');
		$("#account-password").append('<div class="account-item"><div class="account-change-password-wrapper"><a href="/account/change-password">Change Password</a></div></div>');

		if (Object.keys(data['account_content']['orders_data']).length >= 1) {
			for (var order in data['account_content']['orders_data']) {	
				var order_total_amount = data['account_content']['orders_data'][order]['order_total']
				var order_total_amount_formatted = '$' + order_total_amount.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");			
				$("#my-account-body").append('<div id="account-orders-' + data['account_content']['orders_data'][order]['order_id'] + '" class="account-section-details"></div>');
				$("#account-orders-" + data['account_content']['orders_data'][order]['order_id']).append('<div class="account-item"><span class="account-my-information-label">Order Total</span>: <span class="account-my-information-value">' + order_total_amount_formatted + '</span></div>');
				var order_date = new Date(data['account_content']['orders_data'][order]['order_date_time']);
				var options = { year: 'numeric', month: 'long', day: 'numeric' };
				var order_date_formatted = order_date.toLocaleDateString("en-US",options)
				$("#account-orders-" + data['account_content']['orders_data'][order]['order_id']).append('<div class="account-item"><span class="account-my-information-label">Order Date</span>: <span class="account-my-information-value">' + order_date_formatted + '</span></div>');
				$("#account-orders-" + data['account_content']['orders_data'][order]['order_id']).append('<div class="account-item"><div class="account-change-password-wrapper"><a href="/account/order?identifier=' + data['account_content']['orders_data'][order]['identifier'] + '">View Details</a></div></div>');
			}
		}
		else {
				$("#my-account-body").append('<div id="account-order-details" class="account-section-details"></div>');
				}$("#account-order-details").append('<div class="account-item"><span class="account-my-information-value">There are no orders associated with your account.</span></div>');
				

		$('#verify-email-address').click(function (event) {
			//console.log('clicked verify ');
			//console.log(event);
			verify_email_address();
		});

		$.ajax({
			method: "GET",
			url: env_vars['api_url'] + "/user/token",
			dataType: "json",
		    xhrFields: {
		        withCredentials: true
		    }
		})
		.done(function() {
			load_token();
		    //console.log('get login-form succeeded');
		})
		.fail(function(xhr, textStatus, errorThrown) {
		    //console.log('get token failed');
	        //console.log('xhr.status is ' + xhr.status);
			$.log_client_event('ajaxerror', 'account-token');
			switch (xhr.status) {
		        default:
					$.display_page_fatal_error('my-account-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
		           	break;
		    }	        
		});		
	}
	else {

		var email_verification_code_url_str = '';
		if ($.urlParam('email_verification_code') != null) {
			email_verification_code = $.urlParam('email_verification_code');
			email_verification_code_url_str = '&email_verification_code=' + email_verification_code;
		}

		window.location = '/login?next=account' + email_verification_code_url_str;
	}

}

set_up_stripe_checkout_handler = function (email, stripe_publishable_key) {
	var description_str = 'Update Shipping and Billing Info';
	stripe_checkout_handler = StripeCheckout.configure({
		key: stripe_publishable_key,
		name: 'StartupWebApp.com',
		panelLabel: 'Save',
		description: description_str,
		zipCode: true,
		email: email,
		locale: 'auto',
		billingAddress: true,
		shippingAddress: true,
		amount: 0,
		token: stripe_checkout_handler_token_callback
	});	 	
}
stripe_checkout_handler_token_callback = function(token, args) {
	//console.log(token);
	//console.log(token.card);
	//console.log('args are...');
	//console.log(args);
	// You can access the token ID with `token.id`.
	// Get the token ID to your server-side code for use.
	stripe_checkout_handler.close();

	stripe_payment_token = token;
	stripe_payment_args = args;
	display_payment_data();
	process_stripe_payment_token();
}

process_stripe_payment_token = function() {
	//console.log('stripe_payment_args are...');
	//console.log(stripe_payment_args);
	var json_data = {"stripe_token":stripe_payment_token.id, "email":stripe_payment_token.email, "stripe_payment_args":JSON.stringify(stripe_payment_args)};

	//console.log('json_data is ...');
	//console.log(json_data);

	$.ajax({
		method: "POST",
		url: env_vars['api_url'] + "/user/process-stripe-payment-token",
		dataType: "json",
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
		success: process_stripe_payment_token_callback,
		beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader("X-CSRFToken", csrftoken);
	    }
	})
	.fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
		$.log_client_event('ajaxerror', 'user-process-stripe-payment-token');
		switch (xhr.status) {
	        case 403:
	           // handle unauthorized
				if (token_retried == false) {
					//console.log('retrying token');
					token_retried = true;
					$.get_token(process_stripe_payment_token);
				}
				else {
		        	$.display_page_fatal_error('my-account-body');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('my-account-body');
	           	break;
	    }	        
	});	
}
process_stripe_payment_token_callback = function( data, textStatus, xhr ) {
	//console.log(data);

 	if (data['process_stripe_payment_token'] == 'success') {
		console.log('process_stripe_payment_token successful');
	}
	else {
		//console.log('process_stripe_payment_token_callback error');
		var errors = [];
		if (data['errors']['error'] == 'stripe-token-required') {
			errors.push({'type': 'stripe-token-required','description': 'An error occurred while processing your payment.'});
			$.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
			$.log_client_event('ajaxerror', 'confirm-stripe-token-required');
		}
		else if (data['errors']['error'] == 'error-creating-stripe-customer') {
			errors.push({'type': 'error-creating-stripe-customer','description': 'An error occurred while processing your payment.'});
			$.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
			$.log_client_event('ajaxerror', 'confirm-error-creating-stripe-customer');
		}
		else {
			errors.push({'type': 'confirm-undefined','description': 'There was an undefined error processing your request.'});
			$.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
			$.log_client_event('ajaxerror', 'confirm-error-creating-stripe-customer-undefined');
		}
	}
}

display_payment_data = function() {

	$("#my-shipping-billing-address-payment-info").html('');
	$("#my-shipping-billing-address-payment-info").append('<div class="account-item"><div class="account-change-password-wrapper"><a id="edit_shipping_and_billing_addresses_and_payment_info" href="/account">Edit Shipping & Billing Addresses and Payment Information</a></div></div>');
	//console.log(stripe_payment_args);
	if (typeof stripe_payment_args == 'undefined' || typeof stripe_payment_token == 'undefined') {
		$("#my-shipping-billing-address-payment-info").append('<div class="account-item"><span class="account-my-information-value">No shipping or billing information is associated with your account.</span></div>');
	}
	else {
		if (typeof stripe_payment_args.shipping_address_state == 'undefined') {
			stripe_payment_args.shipping_address_state = '';
		}
		if (typeof stripe_payment_args.billing_address_state == 'undefined') {
			stripe_payment_args.billing_address_state = '';
		}
		$("#my-shipping-billing-address-payment-info").append('<div class="account-item"><div class="account-address-wrapper account-address-label-wrapper"><span class="account-my-information-label">Shipping Address</span>: </div><div class="account-address-wrapper"><span class="account-my-information-value">' + stripe_payment_args['shipping_name'] + '<br>' + stripe_payment_args['shipping_address_line1'] + '<br>' + stripe_payment_args['shipping_address_city'] + ', ' + stripe_payment_args['shipping_address_state'] + ' ' + stripe_payment_args['shipping_address_zip'] + '<br>' + stripe_payment_args['shipping_address_country'] + '</span></div></div>');
		$("#my-shipping-billing-address-payment-info").append('<div class="account-item"><div class="account-address-wrapper account-address-label-wrapper"><span class="account-my-information-label">Billing Address</span>: </div><div class="account-address-wrapper"><span class="account-my-information-value">' + stripe_payment_args['billing_name'] + '<br>' + stripe_payment_args['billing_address_line1'] + '<br>' + stripe_payment_args['billing_address_city'] + ', ' + stripe_payment_args['billing_address_state'] + ' ' + stripe_payment_args['billing_address_zip'] + '<br>' + stripe_payment_args['billing_address_country'] + '</span></div></div>');
		$("#my-shipping-billing-address-payment-info").append('<div class="account-item"><div class="account-address-wrapper account-address-label-wrapper"><span class="account-my-information-label">Payment Information</span>: </div><div class="account-address-wrapper"><span class="account-my-information-value">' + stripe_payment_token['card']['brand'] + ': **** **** **** ' + stripe_payment_token['card']['last4'] + ', Exp: ' + stripe_payment_token['card']['exp_month'] + '/' + stripe_payment_token['card']['exp_year'] + '</span></div></div>');
	}

	$('#edit_shipping_and_billing_addresses_and_payment_info').click(function (event) {
		//console.log('edit_shipping_and_billing_addresses_and_payment_info clicked');
		stripe_checkout_handler.open({
		});
		// prevent link redirection
        return false;
	});
}

verify_email_address = function () {
	//console.log('verify_email_address called');
	$('#verify-email-address').unbind("click");

    $(".email-verify-loader-wrapper").remove();
    $(".verify-email-button-wrapper").remove();
    $("#email-verify-error-retry-message").remove();
    $("#email-verify-recently-sent-message").remove();
    $("#verify-email").append('<div class="email-verify-loader-wrapper"><div class="email-verify-loader"></div></div>');

    $.ajax({
        method: "GET",
        url: env_vars['api_url'] + "/user/verify-email-address",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: verify_email_address_callback
    })
	.fail(function(xhr, textStatus, errorThrown) {
	    //console.log('verify_email_address failed');
        //console.log('xhr.status is ' + xhr.status);
		$.log_client_event('ajaxerror', 'account-verify-email-address');
		switch (xhr.status) {
	        default:
				$(".email-verify-loader-wrapper").remove();
		        $(".verify-email-button-wrapper").remove();
		        $("#email-verify-error-retry-message").remove();
		        $("#email-verify-recently-sent-message").remove();
				$("#verify-email").append('<div class="verify-email-button-wrapper"><input id="verify-email-address" type="submit" class="verify-email-button" value="Send New Verification Code"></div><span id="email-verify-error-retry-message" class="account-my-information-note">(An error occurred while sending the verification email. Please try again. If that doesn\'t work, please clear browser cache and cookies and try reloading again.)</span>');
				$('#verify-email-address').click(function (event) {
					verify_email_address();
				});
	           	break;
	    }	        
	});		
}

verify_email_address_callback = function (data, textStatus, xhr) {
	//console.log('verify_email_address_callback called');
	//console.log(data);

	if (data['verify_email_address'] == 'verification_email_sent') {
	    //console.log('');
	    console.log($(".verify-email-button-wrapper"));
	    $(".email-verify-loader-wrapper").remove();
        $(".verify-email-button-wrapper").remove();
        $("#email-verify-error-retry-message").remove();
        $("#email-verify-recently-sent-message").remove();
		$("#verify-email").append(' <span class="account-my-information-note">(A verification email was sent to your email address. If you don\'t receive it in 5 minutes please check your Spam and Junk folders.)</span>');
	}
	else if (data['verify_email_address'] == 'user_not_authenticated') {
		window.location = '/login?next=account';
	}
	else if (data['verify_email_address'] == 'email_failed') {
		$(".email-verify-loader-wrapper").remove();
        $(".verify-email-button-wrapper").remove();
        $("#email-verify-error-retry-message").remove();
        $("#email-verify-recently-sent-message").remove();
		$("#verify-email").append('<div class="verify-email-button-wrapper"><input id="verify-email-address" type="submit" class="verify-email-button" value="Send New Verification Code"></div><span id="email-verify-error-retry-message" class="account-my-information-note">(An error occurred while sending the verification email. Please try again.)</span>');
		$('#verify-email-address').click(function (event) {
			verify_email_address();
		});
	}
	else if (data['verify_email_address'] == 'user_not_authenticated') {
		window.location = '/login?next=account'
	}
}

verify_email_address_response = function() {

	if (!email_verified) {
		var json_data = {"email_verification_code":email_verification_code};

		//console.log(json_data);

		$.ajax({
			method: "POST",
			url: env_vars['api_url'] + "/user/verify-email-address-response",
			dataType: "json",
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
			success: verify_email_address_response_callback,
			beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader("X-CSRFToken", csrftoken);
		    }
		})
		.fail(function(xhr, textStatus, errorThrown) {
		    //console.log('verify_email_address_response failed');
	        //console.log('xhr.status is ' + xhr.status);
			$.log_client_event('ajaxerror', 'account-verify-email-address-response');
			switch (xhr.status) {
		        default:
				    $(".email-verify-loader-wrapper").remove();
			        $(".verify-email-button-wrapper").remove();
			        $("#email-verify-error-retry-message").remove();
			        $("#email-verify-recently-sent-message").remove();
					$("#verify-email").append('<span id="email-verify-error-retry-message" class="account-my-information-note">(An error occurred while verifying your email address. Please reload the page to try again. If that doesn\'t work, please clear browser cache and cookies and try reloading again.)</span>');
		           	break;
		    }	        
		});		
	}
}

verify_email_address_response_callback = function (data, textStatus, xhr) {
	//console.log('verify_email_address_response_callback called');
	//console.log(data);

	if (data['verify_email_address_response'] == 'success') {
		//console.log('create_account succeeded but login failed');
	    $(".email-verify-loader-wrapper").remove();
        $(".verify-email-button-wrapper").remove();
        $("#email-verify-error-retry-message").remove();
        $("#email-verify-recently-sent-message").remove();
        $("#email-verified-value").empty();
        $("#email-verified-value").append('Yes');
		$("#verify-email").append(' <span class="account-my-information-note">(Your email has been successfully verified!)</span>');
	}
	else if (data['verify_email_address'] == 'user_not_authenticated') {
		var email_verification_code_url_str = '';
		if ($.urlParam('email_verification_code') != null) {
			email_verification_code = $.urlParam('email_verification_code');
			email_verification_code_url_str = '&email_verification_code=' + email_verification_code;
		}
		window.location = '/login?next=account' + email_verification_code_url_str;
	}
	else if (data['verify_email_address_response'] == 'code-doesnt-match' || data['verify_email_address_response'] == 'signature-invalid' || data['verify_email_address_response'] == 'signature-expired') {
		//console.log('create_account succeeded but login failed');
		$(".email-verify-loader-wrapper").remove();
        $(".verify-email-button-wrapper").remove();
        $("#email-verify-error-retry-message").remove();
        $("#email-verify-recently-sent-message").remove();
		$("#verify-email").append('<div class="verify-email-button-wrapper"><input id="verify-email-address" type="submit" class="verify-email-button" value="Send New Verification Code"></div><span id="email-verify-error-retry-message" class="account-my-information-note">(We\'re sorry, but the link to verify your email address failed. Please try requesting another verification email.)</span>');
		$('#verify-email-address').click(function (event) {
			verify_email_address();
		});
	}
}


