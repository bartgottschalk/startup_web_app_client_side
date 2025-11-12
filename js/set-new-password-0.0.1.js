var csrftoken;
var env_vars = $.env_vars();
var password_reset_code;

var username_field = $('#set-new-password-username');
var new_password_field = $('#set-new-password-new-password');
var confirm_new_password_field = $('#set-new-password-confirm-new-password');

var general_error = $('#set-new-password-general-error');
var username_error = $('#set-new-password-username-error');
var new_password_error = $('#set-new-password-new-password-error');
var confirm_new_password_error = $('#set-new-password-confirm-new-password-error');

var token_retried = false;

$(document).ready(function() {
    //console.log('hello');

    set_up_set_new_password_form_listeners();

    $.get_token();

    if ($.urlParam('password_reset_code') != null) {
        password_reset_code = $.urlParam('password_reset_code');
        //console.log(password_reset_code);
    }
});

set_up_set_new_password_form_listeners = function() {
    //console.log('set_up_create_account_form_listeners called');

    $.set_place_holder_listeners(username_field, 'Username *');
    $.set_place_holder_listeners(new_password_field, 'New Password *');
    $.set_place_holder_listeners(confirm_new_password_field, 'Confirm New Password *');

    $.bind_key_to_form_submit_button(username_field, 'enterKey', $('#set-new-password-go'), 13);
    $.bind_key_to_form_submit_button(new_password_field, 'enterKey', $('#set-new-password-go'), 13);
    $.bind_key_to_form_submit_button(confirm_new_password_field, 'enterKey', $('#set-new-password-go'), 13);

    $('#set-new-password-go').click(function (event)
    {
        set_new_password();
    });
};

set_new_password = function() {
    //console.log('login clicked');

    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    username_field.attr('class', 'login-text-box');
    username_error.attr('class', 'login-form-error-text-hidden');
    username_error.empty();

    new_password_field.attr('class', 'login-text-box');
    new_password_error.attr('class', 'login-form-error-text-hidden');
    new_password_error.empty();

    confirm_new_password_field.attr('class', 'login-text-box');
    confirm_new_password_error.attr('class', 'login-form-error-text-hidden');
    confirm_new_password_error.empty();

    var username_val = username_field.val();
    var new_password_val = new_password_field.val();
    var confirm_new_password_val = confirm_new_password_field.val();

    var username_valid = $.isUserNameValid(username_val, 150);
    $.display_errors(username_valid, username_error, username_field, 'username');

    var new_password_valid = $.isPasswordValid(new_password_val, 150);
    $.display_errors(new_password_valid, new_password_error, new_password_field, 'new_password');

    var confirm_new_password_valid = $.isConfirmPasswordValid(confirm_new_password_val, new_password_val);
    $.display_errors(confirm_new_password_valid, confirm_new_password_error, confirm_new_password_field, 'confirm_new_password');

    if (username_valid.length == 0 && new_password_valid.length == 0 && confirm_new_password_valid.length == 0) {
	    $('.login-go-button-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

        var json_data = {'username':username_val, 
						 'new_password':new_password_val, 
						 'confirm_new_password':confirm_new_password_val,
						 'password_reset_code':password_reset_code,
        };

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/set-new-password',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: set_new_password_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', csrftoken);
		    },
        })
            .fail(function(xhr, textStatus, errorThrown) {
		    //console.log('post set-new-password failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'set-new-password-set-new-password');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(set_new_password);
                    }
                    else {
			        	$.display_page_fatal_error('set-new-password-form-wrapper');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('set-new-password-form-wrapper');
		           	break;
		    }	        
            });
    }
};

set_new_password_callback = function( data, textStatus, xhr ) {	
    //console.log(data);
    if (data['set_new_password'] == 'success') {
        //console.log('set_new_password succeeded');
	    $('#set-new-password-form-wrapper').empty();
	    $('#set-new-password-form-wrapper').append('<div class="set-password-information-note">Your password has been updated. Continue to <span class="login-form-error-link"><a href=\"/login\">login</a></span> with you new password.</div>');
    }
    else if (data['set_new_password'] == 'username-not-found') {
        //console.log('set_new_password failed with status returned as "username-not-found"');
        general_error.attr('class', 'login-form-error-text');
        general_error.append(data['error'] + ' Please check the data you entered and try again.');
        reset_submit_button();
    }
    else if (data['set_new_password'] == 'password-error') {
        //console.log('set_new_password failed with status returned as "password-error"');
        for (var key in data['errors']) {
            $.display_errors(data['errors'][key], $('#set-new-password-' + key + '-error'), $('#set-new-password-' + key), key);
	    }
        reset_submit_button();
    }
    else if (data['set_new_password'] == 'code-doesnt-match' || data['set_new_password'] == 'signature-invalid' ||data['set_new_password'] == 'signature-expired') {
        //console.log('set_new_password failed with status returned as "' + data['set_new_password'] + '"');
	    $('#set-new-password-form-wrapper').empty();
	    $('#set-new-password-form-wrapper').append('<div class="set-password-information-note">The password reset code you\'re attempting to use either doesn\'t match the username you provided or it has expired. Please <span class="login-form-error-link"><a href=\"/reset-password\">request another code</a></span> and try again.</div>');
    }
};

reset_submit_button = function() {
    $('#go-button-wrapper').empty();
    $('#go-button-wrapper').append('<div class="login-go-button-wrapper"><input id="set-new-password-go" type="submit" class="login-go-button" value="SAVE NEW PASSWORD"></div>');	

    $('#set-new-password-go').click(function (event)
    {
        set_new_password();
    });    
};