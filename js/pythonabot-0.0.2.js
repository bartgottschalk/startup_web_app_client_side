var env_vars = $.env_vars();

var email_address_field = $('#notify_me_email_address');
var notify_me_how_excited_radio_option = $('#notify_me_how_excited');

var email_address_error = $('#notify_me_email_address_error');
var how_excited_error = $('#how_excited_error');

var token_retried = false;

$(document).ready(function() {
    //console.log('hello');

    set_up_pythonabot_form_listeners();

    $.get_token();
});

set_up_pythonabot_form_listeners = function() {
    //console.log('set_up_pythonabot_form_listeners called');

    $.set_place_holder_listeners(email_address_field, 'Email Address Where I Can Reach You');

    $.bind_key_to_form_submit_button(email_address_field, 'enterKey', $('#coming_soon_submit_button'), 13);
    $.bind_key_to_form_submit_button(notify_me_how_excited_radio_option, 'enterKey', $('#coming_soon_submit_button'), 13);	

    $('#coming_soon_submit_button').click(function (event)
    {
        submit_pythonabot_coming_soon();
    });
};

submit_pythonabot_coming_soon = function() {
    //console.log('login clicked');

    email_address_field.attr('class', 'notify-me-email-text-box');
    email_address_error.attr('class', 'login-form-error-text-hidden');
    email_address_error.empty();
    how_excited_error.attr('class', 'login-form-error-text-hidden');
    how_excited_error.empty();

    var email_address_val = email_address_field.val();
    var how_excited_val = $('input[name=notify_me_how_excited]:checked').val();
    //console.log(how_excited_val);

    var email_address_valid = $.isEmailValid(email_address_val, 254);
    $.display_errors(email_address_valid, email_address_error, email_address_field, 'email_address', false, 'notify-me-email-text-box-error', 'notify-me-error-text');

    var how_excited_valid = true;
    if (typeof how_excited_val == 'undefined') {
        how_excited_valid = false;
        how_excited_error.attr('class', 'notify-me-error-text');
        how_excited_error.append('Please select one of the options for how excited you are to meet PythonABot.');		
    }

    if (email_address_valid.length == 0 && how_excited_valid) {
	    $('.notify-me-go-button-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

        var json_data = {'email_address':email_address_val, 'how_excited':how_excited_val};

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/pythonabot-notify-me',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: pythonabot_notify_me_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    },
        })
            .fail(function(xhr, textStatus, errorThrown) {
	        //console.log('pythonabot-notify-me failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'pythonabot-pythonabot-notify-me');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(submit_pythonabot_coming_soon);
                    }
                    else {
			        	$.display_page_fatal_error('notify_me_wrapper', 'We\'re sorry. An error has occurred while saving your data. Please try refreshing the page and try again. If that doesn\'t work, please clear browser cache and cookies and try reloading again.');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('notify_me_wrapper', 'We\'re sorry. An error has occurred while saving your data. Please try refreshing the page and try again. If that doesn\'t work, please clear browser cache and cookies and try reloading again.');
		           	break;
		    }	        
            });
    }
};

pythonabot_notify_me_callback = function( data, textStatus, xhr ) {	
    //console.log(data);
    if (data['pythonabot_notify_me'] == 'success') {
        //console.log('pythonabot-notify-me succeeded');
	    $('.create-account-loader-wrapper').remove();	   
	    $('#notify_me_wrapper').addClass('hide');
        $('#coming_soon_success_message').removeClass('hide');
    }
    else if (data['pythonabot_notify_me'] == 'duplicate_prospect') {
	    $('.create-account-loader-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="notify-me-go-button-wrapper"><input id="coming_soon_submit_button" type="submit" class="notify-me-go-button" value="SUBMIT"></div>');

        $.bind_key_to_form_submit_button(email_address_field, 'enterKey', $('#coming_soon_submit_button'), 13);
        $.bind_key_to_form_submit_button(notify_me_how_excited_radio_option, 'enterKey', $('#coming_soon_submit_button'), 13);	

        $('#coming_soon_submit_button').click(function (event)
        {
            submit_pythonabot_coming_soon();
        });

        for (var key in data['errors']) {
            $.display_errors(data['errors'][key], $('#notify_me_' + key + '_error'), $('#notify_me_' + key), key);
	    }
    }
    else {
	    $('.create-account-loader-wrapper').remove();
        // show some error message
        $('#notify_me_general_error').attr('class', 'notify-me-error-text');
        $('#notify_me_general_error').append('There was an error submitting your data. Please check the values and try again. [E: 01]');
    }
};