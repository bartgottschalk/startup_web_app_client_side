var env_vars = $.env_vars();

var firstname_field = $('#create-account-firstname');
var lastname_field = $('#create-account-lastname');
var username_field = $('#create-account-username');
var email_address_field = $('#create-account-email-address');
var password_field = $('#create-account-password');
var confirm_password_field = $('#create-account-confirm-password');
var terms_of_use_agree_field = $('#terms-of-use-agree');

var general_error = $('#create-account-general-error');
var firstname_error = $('#create-account-firstname-error');
var lastname_error = $('#create-account-lastname-error');
var username_error = $('#create-account-username-error');
var email_address_error = $('#create-account-email-address-error');
var password_error = $('#create-account-password-error');
var confirm_password_error = $('#create-account-confirm-password-error');
var terms_of_use_agree_error = $('#create-account-terms-of-use-agree-error');

$(document).ready(function() {
    //console.log('hello');

    $('#create-account-form').submit(false);
    set_up_create_account_form_listeners();

    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/user/token',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    }
    })
        .done(function() {
            load_token();
	    //console.log('get login-form succeeded');
        })
        .fail(function() {
	    //console.log('get token failed');
            $.log_client_event('ajaxerror', 'create-account-token');
            $.display_page_fatal_error('create-account-form-wrapper');
        });
});

load_token = function( data ) {
    csrftoken = $.getCookie('csrftoken');
};

set_up_create_account_form_listeners = function() {
    //console.log('set_up_create_account_form_listeners called');

    $.set_place_holder_listeners(firstname_field, 'First Name *');
    $.set_place_holder_listeners(lastname_field, 'Last Name *');
    $.set_place_holder_listeners(username_field, 'Username *');
    $.set_place_holder_listeners(email_address_field, 'Email Address *');
    $.set_place_holder_listeners(password_field, 'Password *');
    $.set_place_holder_listeners(confirm_password_field, 'Confirm Password *');

    $.bind_key_to_form_submit_button(firstname_field, 'enterKey', $('#create-account-go'), 13);
    $.bind_key_to_form_submit_button(lastname_field, 'enterKey', $('#create-account-go'), 13);
    $.bind_key_to_form_submit_button(username_field, 'enterKey', $('#create-account-go'), 13);
    $.bind_key_to_form_submit_button(email_address_field, 'enterKey', $('#create-account-go'), 13);
    $.bind_key_to_form_submit_button(password_field, 'enterKey', $('#create-account-go'), 13);
    $.bind_key_to_form_submit_button(confirm_password_field, 'enterKey', $('#create-account-go'), 13);

    $('#create-account-go').click(function (event)
    {
        create_account();
    });
};

create_account = function() {
    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    firstname_field.attr('class', 'login-text-box');
    firstname_error.attr('class', 'login-form-error-text-hidden');
    firstname_error.empty();

    lastname_field.attr('class', 'login-text-box');
    lastname_error.attr('class', 'login-form-error-text-hidden');
    lastname_error.empty();

    username_field.attr('class', 'login-text-box');
    username_error.attr('class', 'login-form-error-text-hidden');
    username_error.empty();

    email_address_field.attr('class', 'login-text-box');
    email_address_error.attr('class', 'login-form-error-text-hidden');
    email_address_error.empty();

    password_field.attr('class', 'login-text-box');
    password_error.attr('class', 'login-form-error-text-hidden');
    password_error.empty();

    confirm_password_field.attr('class', 'login-text-box');
    confirm_password_error.attr('class', 'login-form-error-text-hidden');
    confirm_password_error.empty();

    terms_of_use_agree_field.attr('class', 'login-remember-me-checkbox');
    terms_of_use_agree_error.attr('class', 'login-form-error-text-hidden');
    terms_of_use_agree_error.empty();

    var firstname_val = firstname_field.val();
    var lastname_val = lastname_field.val();
    var username_val = username_field.val();
    var email_address_val = email_address_field.val();
    var password_val = password_field.val();
    var confirm_password_val = confirm_password_field.val();

    var newsletter_val = 'false';
    if ($('#newsletter').is(':checked')) {
        newsletter_val = 'true';
    }
    //console.log('newsletter_val is ' + newsletter_val);

    var remember_me_val = 'false';
    if ($('#remember_me').is(':checked')) {
        remember_me_val = 'true';
    }
    //console.log('remember_me_val is ' + remember_me_val);

    var terms_of_use_agree_val = 'false';
    if ($('#terms-of-use-agree').is(':checked')) {
        terms_of_use_agree_val = 'true';
    }
    //console.log('terms_of_use_agree_val is ' + terms_of_use_agree_val);

    var firstname_valid = $.isNameValid(firstname_val, 30);
    $.display_errors(firstname_valid, firstname_error, firstname_field, 'firstname');

    var lastname_valid = $.isNameValid(lastname_val, 150);
    $.display_errors(lastname_valid, lastname_error, lastname_field, 'lastname');

    var username_valid = $.isUserNameValid(username_val, 150);
    $.display_errors(username_valid, username_error, username_field, 'username');

    var email_address_valid = $.isEmailValid(email_address_val, 254);
    $.display_errors(email_address_valid, email_address_error, email_address_field, 'email_address');

    var password_valid = $.isPasswordValid(password_val, 150);
    $.display_errors(password_valid, password_error, password_field, 'password');

    var confirm_password_valid = $.isConfirmPasswordValid(confirm_password_val, password_val);
    $.display_errors(confirm_password_valid, confirm_password_error, confirm_password_field, 'confirm_password');

    var terms_of_use_agree_valid = $.isTermsOfUseAgreeValid(terms_of_use_agree_val);
    $.display_errors(terms_of_use_agree_valid, terms_of_use_agree_error, terms_of_use_agree_field, 'terms_of_use_agree', true);

    if (firstname_valid.length == 0 && lastname_valid.length == 0 && username_valid.length == 0 && email_address_valid.length == 0 && password_valid.length == 0 && confirm_password_valid.length == 0 && terms_of_use_agree_valid.length == 0) {
	    $('.login-go-button-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');


        var json_data = {'firstname':firstname_val,
						 'lastname':lastname_val, 
						 'username':username_val, 
						 'email_address':email_address_val, 
						 'password':password_val, 
						 'confirm_password':confirm_password_val, 
						 'newsletter':newsletter_val,
						 'remember_me':remember_me_val
        };

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/create-account',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: create_account_success,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    }
        })
            .fail(function() {
		    //console.log('post create account failed');
                $.log_client_event('ajaxerror', 'create-account-create-account');
		    $('#create-account-general-error').attr('class', 'login-form-error-text');
		    $('.create-account-loader-wrapper').remove();
                $('#create-account-general-error').append("We\'re sorry. An error has occurred while creating your account. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.");
            });
    }
};

create_account_success = function( data, textStatus, xhr ) {
	
    //console.log(data);
    //console.log('create_account_success called');
    if (data['create_account'] == 'true') {
        //console.log('create_account success');

        var next_url_st = '';
        if ($.urlParam('next') != null) {
            next_url_st = $.urlParam('next');
            window.location = next_url_st;
        }
        else {
            window.location = '/account/';
        }


    }
    else if (data['create_account'] == 'created_but_login_failed') {
        //console.log('create_account succeeded but login failed');

	    $('.create-account-loader-wrapper').remove();
        // show some error message
        $('#create-account-general-error').attr('class', 'login-form-error-text');
        $('#create-account-general-error').append('Your account was successfully created but there was an error logging you in. Please <span class="login-form-error-link"><a href="/login">login</a></span>. [E: 03]');
    }
    else {
        //console.log('create_account failed');
	    $('.create-account-loader-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="login-go-button-wrapper"><input id="create-account-go" type="submit" class="login-go-button" value="CREATE ACCOUNT"></div>');

        $('#create-account-go').click(function (event)
        {
            create_account();
        });

        // show some error message
        $('#create-account-general-error').attr('class', 'login-form-error-text');
        $('#create-account-general-error').append('There was an error creating your account. Please check the values and try again. [E: 02]');

        for (var key in data['errors']) {
            $.display_errors(data['errors'][key], $('#create-account-' + key + '-error'), $('#create-account-' + key), key);
	    }

    }
};