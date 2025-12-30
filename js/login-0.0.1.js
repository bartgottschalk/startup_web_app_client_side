var env_vars = $.env_vars();

$(document).ready(function() {
    //console.log('hello');

    set_up_login_form_listeners();

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
            $.log_client_event('ajaxerror', 'login-token');
            $.display_page_fatal_error('login-wrapper');
        });

    $('#create-account').click(function (event)
    {
        window.location = '/create-account';
    });

    if ($.urlParam('message') != null) {
        switch ($.urlParam('message')) {
	        case 'not-authenticated':
            $('#login-general-notification').append('You are no longer logged in. Please log in to continue.');
            break;
        }
    }		
});

load_token = function( data ) {
    csrftoken = $.getCookie('csrftoken');
};

set_up_login_form_listeners = function() {
    //console.log('set_up_login_form_listeners called');

    $('#login-go').click(function (event)
    {
        //console.log('login clicked');

        $('#login-general-error').attr('class', 'login-form-error-text-hidden');
        $('#login-general-error').empty();

        $('#login-username').attr('class', 'login-text-box');
        $('#login-username-error').attr('class', 'login-form-error-text-hidden');
        $('#login-username-error').empty();


        $('#login-pswd').attr('class', 'login-text-box');
        $('#login-password-error').attr('class', 'login-form-error-text-hidden');
        $('#login-password-error').empty();

        var email_val = $('#login-username').val();
        var pswd_val = $('#login-pswd').val();
        var remember_me_val = 'false';
        if ($('#remember_me').is(':checked')) {
            remember_me_val = 'true';
        }
        //console.log('remember_me_val is ' + remember_me_val);

        var username_valid = $.isLoginUserNameValid(email_val);
        if (username_valid.length >= 1) {
            $('#login-username-error').attr('class', 'login-form-error-text');
            $('#login-username').attr('class', 'login-text-box-error');

            var email_unordered_list = $('<ul>');
            email_unordered_list.attr('id', 'email-error-ul');
            email_unordered_list.attr('class', 'form-errors');
            $('#login-username-error').append(email_unordered_list);
            for (var i = 0; i < username_valid.length; i++) {
                var error_message = '<li>' + username_valid[i]['description'] + '</li>';
                $('#email-error-ul').append(error_message);
            }
        }

        var password_valid = $.isLoginPasswordValid(pswd_val);
        if (password_valid.length >= 1) {
            $('#login-password-error').attr('class', 'login-form-error-text');
            $('#login-pswd').attr('class', 'login-text-box-error');
            var password_unordered_list = $('<ul>');
            password_unordered_list.attr('id', 'password-error-ul');
            password_unordered_list.attr('class', 'form-errors');
            $('#login-password-error').append(password_unordered_list);
            for (var i = 0; i < password_valid.length; i++) {
                var error_message = '<li>' + password_valid[i]['description'] + '</li>';
                $('#password-error-ul').append(error_message);
            }
        }

        if (username_valid.length == 0 && password_valid.length == 0) {
            var json_data = {'username':email_val,'password':pswd_val, 'remember_me':remember_me_val};

            $.ajax({
                method: 'POST',
                url: env_vars['api_url'] + '/user/login',
                dataType: 'json',
			    xhrFields: {
			        withCredentials: true
			    },
			    data: json_data,
        		success: login_success,
                beforeSend: function(request) {
				    //console.log('in beforeSend');
				    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
			    }
            })
                .fail(function() {
			    //console.log('post login failed');
                    $.log_client_event('ajaxerror', 'login-login');
                    $('#login-general-error').attr('class', 'login-form-error-text');
                    $('#login-general-error').append("We\'re sorry. An error has occurred while responding to your login request. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.");
                });
        }

    });


    var username_field = $('#login-username');
    var password_field = $('#login-pswd');

    $.set_place_holder_listeners(username_field, 'Username *');
    $.set_place_holder_listeners(password_field, 'Password *');

    $.bind_key_to_form_submit_button(username_field, 'enterKey', $('#login-go'), 13);
    $.bind_key_to_form_submit_button(password_field, 'enterKey', $('#login-go'), 13);
};

login_success = function( data, textStatus, xhr ) {
    //console.log('login_success called');
    if (data['login'] == 'true') {
        //console.log('login success');
		
        var next_url_st = '';
        if ($.urlParam('next') != null) {
            next_url_st = $.urlParam('next');
            if ($.urlParam('email_verification_code') != null) {
                next_url_st += '?email_verification_code=' + $.urlParam('email_verification_code');
            }
            else if ($.urlParam('order_identifier') != null) {
                next_url_st += '?identifier=' + $.urlParam('order_identifier');
            }

            window.location = next_url_st;
        }
        else {
            window.location = '/account/';
        }
    }
    else {
        //console.log('login failed');
        // show some error message
        $('#login-general-error').attr('class', 'login-form-error-text');
        $('#login-general-error').append('Either your username or password was not found. Please check the values and try again.');
    }
};