var csrftoken;
var env_vars = $.env_vars();

var username_field = $('#reset-password-username');
var email_address_field = $('#reset-password-email-address');

var general_error = $('#reset-password-general-error');
var username_error = $('#reset-password-username-error');
var email_address_error = $('#reset-password-email-address-error');

var token_retried = false;

$(document).ready(function() {
    //console.log('hello');

    set_up_reset_password_form_listeners();

    $.get_token();
});

set_up_reset_password_form_listeners = function() {
    //console.log('set_up_create_account_form_listeners called');

    $.set_place_holder_listeners(username_field, 'Username *');
    $.set_place_holder_listeners(email_address_field, 'Email Address *');

    $.bind_key_to_form_submit_button(username_field, 'enterKey', $('#reset-password-go'), 13);
    $.bind_key_to_form_submit_button(email_address_field, 'enterKey', $('#reset-password-go'), 13);

    $('#reset-password-go').click(function (event)
    {
        reset_password();
    });
};

reset_password = function() {
    //console.log('login clicked');

    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    username_field.attr('class', 'login-text-box');
    username_error.attr('class', 'login-form-error-text-hidden');
    username_error.empty();

    email_address_field.attr('class', 'login-text-box');
    email_address_error.attr('class', 'login-form-error-text-hidden');
    email_address_error.empty();

    var username_val = username_field.val();
    var email_address_val = email_address_field.val();

    var username_valid = $.isUserNameValid(username_val, 150);
    $.display_errors(username_valid, username_error, username_field, 'username');

    var email_address_valid = $.isEmailValid(email_address_val, 254);
    $.display_errors(email_address_valid, email_address_error, email_address_field, 'email_address');

    if (username_valid.length == 0 && email_address_valid.length == 0) {
	    $('.login-go-button-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');


        var json_data = {'username':username_val, 
						 'email_address':email_address_val
        };

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/reset-password',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: reset_password_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    },
        })
            .fail(function(xhr, textStatus, errorThrown) {
	        //console.log('reset-password failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'reset-password-reset-password');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(reset_password);
                    }
                    else {
			        	$.display_page_fatal_error('reset-password-form-wrapper');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('reset-password-form-wrapper');
		           	break;
		    }	        
            });
    }
};

reset_password_callback = function( data, textStatus, xhr ) {	
    //console.log(data);
    if (data['reset_password'] == 'success') {
        //console.log('reset_password succeeded');
	    $('.create-account-loader-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="reset-password-information-note">Your password reset request has been received. If we find an account matching the username and email address submitted, you will receive a password reset email containing a link which will be valid for 1 hour.<br><br>NOTE: Please be sure to check your Spam and Junk folders if you don\'t receive the email within 5 minutes.</div>');
    }

};