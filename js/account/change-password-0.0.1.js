var csrftoken;
var env_vars = $.env_vars();

var current_password_field = $('#change-my-password-current-password');
var password_field = $('#change-my-password-password');
var confirm_password_field = $('#change-my-password-confirm-password');

var general_error = $('#change-my-password-general-error');
var current_password_error = $('#change-my-password-current-password-error');
var password_error = $('#change-my-password-password-error');
var confirm_password_error = $('#change-my-password-confirm-password-error');

var token_retried = false;

$(document).ready(function() {
    //console.log(env_vars);
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/user/account-content',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_account
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'change-my-password-account-content');
            $.display_page_fatal_error('change-my-password-form-wrapper', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });

    set_up_change_my_password_form_listeners();

});

load_account = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['account_content']['authenticated'] == 'true') {

        $('.section-title').removeClass('hide');
        $('#change-my-password-form-wrapper').removeClass('hide');

        $('#change-my-password-username').append(data['account_content']['personal_data']['username']);

        $.get_token();
    }
    else {
        window.location = '/login?next=account/change-password&message=not-authenticated';
    }
};

set_up_change_my_password_form_listeners = function() {
    //console.log('set_up_create_account_form_listeners called');

    $.set_place_holder_listeners(current_password_field, 'Current Password *');
    $.set_place_holder_listeners(password_field, 'New Password *');
    $.set_place_holder_listeners(confirm_password_field, 'Confirm New Password *');

    $.bind_key_to_form_submit_button(current_password_field, 'enterKey', $('#change-my-password-go'), 13);
    $.bind_key_to_form_submit_button(password_field, 'enterKey', $('#change-my-password-go'), 13);
    $.bind_key_to_form_submit_button(confirm_password_field, 'enterKey', $('#change-my-password-go'), 13);

    $('#change-my-password-go').click(function (event)
    {
        change_my_password();
    });
};

change_my_password = function() {
    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    current_password_field.attr('class', 'login-text-box');
    current_password_error.attr('class', 'login-form-error-text-hidden');
    current_password_error.empty();

    password_field.attr('class', 'login-text-box');
    password_error.attr('class', 'login-form-error-text-hidden');
    password_error.empty();

    confirm_password_field.attr('class', 'login-text-box');
    confirm_password_error.attr('class', 'login-form-error-text-hidden');
    confirm_password_error.empty();

    var current_password_val = current_password_field.val();
    var password_val = password_field.val();
    var confirm_password_val = confirm_password_field.val();

    var current_password_valid = $.isLoginPasswordValid(current_password_val, 150);
    $.display_errors(current_password_valid, current_password_error, current_password_field, 'current_password');

    var password_valid = $.isPasswordValid(password_val, 150);
    $.display_errors(password_valid, password_error, password_field, 'password');

    var confirm_password_valid = $.isConfirmPasswordValid(confirm_password_val, password_val);
    $.display_errors(confirm_password_valid, confirm_password_error, confirm_password_field, 'confirm_password');

    if (current_password_valid.length == 0 && password_valid.length == 0 && confirm_password_valid.length == 0) {
	    $('.login-go-button-wrapper').remove();
	    $('#cancel-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

        var json_data = {'current_password':current_password_val, 
						 'new_password':password_val, 
						 'confirm_new_password':confirm_password_val
        };

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/change-my-password',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: change_my_password_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', csrftoken);
		    }
        })
            .fail(function(xhr, textStatus, errorThrown) {
		    //console.log('post update-my-information failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'change-my-password-change-my-password');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(change_my_password);
                    }
                    else {
			        	$.display_page_fatal_error('change-my-password-form-wrapper');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('change-my-password-form-wrapper');
		           	break;
		    }	        
            });
    }

};

change_my_password_callback = function( data, textStatus, xhr ) {
	
    //console.log(data);
    //console.log('create_account_success called');
    if (data['change_my_password'] == 'success') {
        //console.log('update_my_information success');
        window.location = '/account?message=password-updated';
    }
    else if (data['change_my_password'] == 'user_not_authenticated') {
        window.location = '/login?next=account/change-password&message=not-authenticated';
    }
    else {
        //console.log('create_account failed');
	    $('.create-account-loader-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="login-go-button-wrapper"><input id="change-my-password-go" type="submit" class="login-go-button" value="SAVE NEW PASSWORD"></div>');
	    $('#go-button-wrapper').append('<div id="cancel-wrapper" class="login-reset-password-wrapper"><a href="/account">Cancel - Back to My Account</a></div>');

        $('#change-my-password-go').click(function (event)
        {
            change_my_password();
        });

        // show some error message
        general_error.attr('class', 'login-form-error-text');
        general_error.append('There was an error updating your password. Please check the values and try again. [E: 02]');

        for (var key in data['errors']) {
            $.display_errors(data['errors'][key], $('#change-my-password-' + key + '-error'), $('#change-my-password-' + key), key);
	    }

        $.bind_key_to_form_submit_button(current_password_field, 'enterKey', $('#change-my-password-go'), 13);
        $.bind_key_to_form_submit_button(password_field, 'enterKey', $('#change-my-password-go'), 13);
        $.bind_key_to_form_submit_button(confirm_password_field, 'enterKey', $('#change-my-password-go'), 13);
    }
};
