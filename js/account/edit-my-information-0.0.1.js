var csrftoken;
var env_vars = $.env_vars();

var firstname_field = $('#edit-my-information-firstname');
var lastname_field = $('#edit-my-information-lastname');
var email_address_field = $('#edit-my-information-email-address');

var general_error = $("#edit-my-information-general-error");
var firstname_error = $('#edit-my-information-firstname-error');
var lastname_error = $('#edit-my-information-lastname-error');
var email_address_error = $('#edit-my-information-email-address-error');

var token_retried = false;

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
		$.log_client_event('ajaxerror', 'edit-my-information-account-content');
		$.display_page_fatal_error('edit-my-information-form-wrapper', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
	});

	set_up_edit_my_information_form_listeners();

});

load_account = function( data, textStatus, xhr ) {
	//console.log(data);

	if (data['account_content']['authenticated'] == 'true') {

		$(".section-title").removeClass('hide');
		$("#edit-my-information-form-wrapper").removeClass('hide');

		$("#edit-my-information-username").append(data['account_content']['personal_data']['username']);
		$("#edit-my-information-firstname").attr('value', data['account_content']['personal_data']['first_name']);
		$("#edit-my-information-lastname").attr('value', data['account_content']['personal_data']['last_name']);
		$("#edit-my-information-email-address").attr('value', data['account_content']['email_data']['email_address']);

		$.get_token();
	}
	else {
		window.location = '/login?next=account/edit-my-information&message=not-authenticated';
	}

}

set_up_edit_my_information_form_listeners = function() {
	//console.log('set_up_create_account_form_listeners called');

	$.set_place_holder_listeners(firstname_field, 'First Name *');
	$.set_place_holder_listeners(lastname_field, 'Last Name *');
	$.set_place_holder_listeners(email_address_field, 'Email Address *');

	$.bind_key_to_form_submit_button(firstname_field, "enterKey", $('#edit-my-information-go'), 13);
	$.bind_key_to_form_submit_button(lastname_field, "enterKey", $('#edit-my-information-go'), 13);
	$.bind_key_to_form_submit_button(email_address_field, "enterKey", $('#edit-my-information-go'), 13);

	$('#edit-my-information-go').click(function (event)
	{
		update_my_information();
	});
}

update_my_information = function() {
	general_error.attr('class', 'login-form-error-text-hidden');
	general_error.empty();

	firstname_field.attr('class', 'login-text-box');
	firstname_error.attr('class', 'login-form-error-text-hidden');
	firstname_error.empty();

	lastname_field.attr('class', 'login-text-box');
	lastname_error.attr('class', 'login-form-error-text-hidden');
	lastname_error.empty();

	email_address_field.attr('class', 'login-text-box');
	email_address_error.attr('class', 'login-form-error-text-hidden');
	email_address_error.empty();

	var firstname_val = firstname_field.val();
	var lastname_val = lastname_field.val();
	var email_address_val = email_address_field.val();

	var firstname_valid = $.isNameValid(firstname_val, 30);
	$.display_errors(firstname_valid, firstname_error, firstname_field, "firstname");

	var lastname_valid = $.isNameValid(lastname_val, 150);
	$.display_errors(lastname_valid, lastname_error, lastname_field, "lastname");

	var email_address_valid = $.isEmailValid(email_address_val, 254);
	$.display_errors(email_address_valid, email_address_error, email_address_field, "email_address");

	if (firstname_valid.length == 0 && lastname_valid.length == 0 && email_address_valid.length == 0) {
	    $(".login-go-button-wrapper").remove();
	    $("#cancel-wrapper").remove();
	    $("#go-button-wrapper").append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

		var json_data = {"firstname":firstname_val,
						 "lastname":lastname_val, 
						 "email_address":email_address_val
		};

		//console.log(json_data);

		$.ajax({
			method: "POST",
			url: env_vars['api_url'] + "/user/update-my-information",
			dataType: "json",
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: update_my_information_callback,
			beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader("X-CSRFToken", csrftoken);
		    }
		})
		.fail(function(xhr, textStatus, errorThrown) {
		    //console.log('post update-my-information failed');
	        //console.log('xhr.status is ' + xhr.status);
			$.log_client_event('ajaxerror', 'edit-my-information-update-my-information');
			switch (xhr.status) {
		        case 403:
		           // handle unauthorized
					if (token_retried == false) {
						//console.log('retrying token');
						token_retried = true;
						$.get_token(update_my_information);
					}
					else {
			        	$.display_page_fatal_error('edit-my-information-form-wrapper');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('edit-my-information-form-wrapper');
		           	break;
		    }	        
		});
	}

}

update_my_information_callback = function( data, textStatus, xhr ) {
	
	//console.log(data);
	//console.log('create_account_success called');
	if (data['update_my_information'] == 'success') {
		//console.log('update_my_information success');
		window.location = "/account";
	}
	else if (data['update_my_information'] == 'user_not_authenticated') {
		window.location = '/login?next=account/edit-my-information&message=not-authenticated';
	}
	else {
		//console.log('create_account failed');
	    $(".create-account-loader-wrapper").remove();
	    $("#go-button-wrapper").append('<div class="login-go-button-wrapper"><input id="edit-my-information-go" type="submit" class="login-go-button" value="SAVE"></div>');
	    $("#go-button-wrapper").append('<div id="cancel-wrapper" class="login-reset-password-wrapper"><a href="/account">Cancel - Back to My Account</a></div>');

		$('#edit-my-information-go').click(function (event)
		{
			update_my_information();
		});

		// show some error message
		general_error.attr('class', 'login-form-error-text');
		general_error.append("There was an error creating your account. Please check the values and try again. [E: 02]");

		for (var key in data['errors']) {
			$.display_errors(data['errors'][key], $('#edit-my-information-' + key + '-error'), $('#edit-my-information-' + key), key);
	    }

		$.bind_key_to_form_submit_button(firstname_field, "enterKey", $('#edit-my-information-go'), 13);
		$.bind_key_to_form_submit_button(lastname_field, "enterKey", $('#edit-my-information-go'), 13);
		$.bind_key_to_form_submit_button(email_address_field, "enterKey", $('#edit-my-information-go'), 13);
	}
}
