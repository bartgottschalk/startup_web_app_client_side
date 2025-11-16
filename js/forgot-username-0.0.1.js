var csrftoken;
var env_vars = $.env_vars();

var email_address_field = $('#forgot-username-email-address');

var general_error = $('#forgot-username-general-error');
var email_address_error = $('#forgot-username-email-address-error');

var token_retried = false;

$(document).ready(function() {
    //console.log('hello');

    set_up_forgot_username_form_listeners();

    $.get_token();
});

set_up_forgot_username_form_listeners = function() {
    //console.log('set_up_forgot_username_form_listeners called');

    $.set_place_holder_listeners(email_address_field, 'Email Address *');

    $.bind_key_to_form_submit_button(email_address_field, 'enterKey', $('#forgot-username-go'), 13);

    $('#forgot-username-go').click(function (event)
    {
        forgot_username();
    });
};

forgot_username = function() {
    //console.log('login clicked');

    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    email_address_field.attr('class', 'login-text-box');
    email_address_error.attr('class', 'login-form-error-text-hidden');
    email_address_error.empty();

    var email_address_val = email_address_field.val();

    var email_address_valid = $.isEmailValid(email_address_val, 254);
    $.display_errors(email_address_valid, email_address_error, email_address_field, 'email_address');

    if (email_address_valid.length == 0) {
	    $('.login-go-button-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');


        var json_data = {'email_address':email_address_val};

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/forgot-username',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: forgot_username_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    },
        })
            .fail(function(xhr, textStatus, errorThrown) {
	        //console.log('forgot-username failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'forgot-username-forgot-username');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(forgot_username);
                    }
                    else {
			        	$.display_page_fatal_error('forgot-username-form-wrapper');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('forgot-username-form-wrapper');
		           	break;
		    }	        
            });
    }
};

forgot_username_callback = function( data, textStatus, xhr ) {	
    //console.log(data);
    if (data['forgot_username'] == 'success') {
        //console.log('forgot_username succeeded');
	    $('.create-account-loader-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="reset-password-information-note">Your request has been received. We will send an email containing the username for each account associated with the email address provided.<br><br>NOTE: Please be sure to check your Spam and Junk folders if you don\'t receive the email within 5 minutes.</div>');
    }

};