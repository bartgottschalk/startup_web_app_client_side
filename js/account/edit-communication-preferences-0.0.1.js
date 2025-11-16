var env_vars = $.env_vars();

var general_error = $('#edit-my-information-general-error');

var token_retried = false;

var newsletter_subscriber = false;

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
            $.log_client_event('ajaxerror', 'edit-communication-preferences-account-content');
            $.display_page_fatal_error('edit-communication-preferences-form-wrapper', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });

    set_up_edit_communication_preferences_form_listeners();

});

load_account = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['account_content']['authenticated'] == 'true') {

        $('.section-title').removeClass('hide');
        $('#edit-communication-preferences-form-wrapper').removeClass('hide');

        if (data['account_content']['personal_data']['email_unsubscribed']) {
            $('#email_unsubscribe').prop('checked', true);	
            $('#edit-communication-preferences-unsubscribed-note').removeClass('hide');

            $('#newsletter').prop('checked', false);	
            $('#newsletter').attr('disabled', true);
            $('#subscribe-to-newsletter-div').addClass('disabled-text');
        }
        else {
            $('#edit-communication-preferences-unsubscribed-note').html('');
        }

        if (data['account_content']['personal_data']['newsletter_subscriber']) {
            newsletter_subscriber = true;
            $('#newsletter').prop('checked', true);	
        }

        $.get_token();
    }
    else {
        window.location = '/login?next=account/edit-communication-preferences&message=not-authenticated';
    }
};

set_up_edit_communication_preferences_form_listeners = function() {
    //console.log('set_up_create_account_form_listeners called');

    $('#email_unsubscribe').click(function (event)
    {
        console.log('email_unsubscribe clicked');
        console.log($('#email_unsubscribe').prop('checked'));
        if ($('#email_unsubscribe').prop('checked') == true) {
            console.log('email_unsubscribe true');
            $('#newsletter').prop('checked', false);	
            $('#newsletter').attr('disabled', true);
            $('#subscribe-to-newsletter-div').addClass('disabled-text');
            $('#edit-communication-preferences-unsubscribed-note').removeClass('hide');

            $('#email-unsubscribe-feedback').removeClass('hide');
            $('#other').change(function() {
			    if(this.checked) {
			    	//console.log('other is checked');
			    	// show textarea
			    	$('#other-answer-textarea').attr('class', 'email-unsubscribe-other-text-box');
	                $('#other-answer-textarea').focus();
			    }
			    else {
			    	//console.log('other is NOT checked');
			    	// hide textarea
			    	$('#other-answer-textarea').attr('class', 'login-form-error-text-hidden');
	                $('#other-answer-textarea').blur();
			    }
            });

        }
        else {
            console.log('email_unsubscribe false');
            $('#newsletter').prop('checked', newsletter_subscriber);	
            $('#newsletter').removeAttr('disabled');
            $('#subscribe-to-newsletter-div').removeClass('disabled-text');
            $('#edit-communication-preferences-unsubscribed-note').addClass('hide');

            $('#email-unsubscribe-feedback').addClass('hide');

        }
    });

    $('#edit-communication-preferences-go').click(function (event)
    {
        update_communication_preferences();
    });
};

update_communication_preferences = function() {
    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    var newsletter_val = $('#newsletter').is(':checked');
    //console.log(newsletter_val);
    var email_unsubscribe_val = $('#email_unsubscribe').is(':checked');

    var no_longer_want_to_receive_val = $('#no-longer-want-to-receive').is(':checked');
    var never_signed_up_val = $('#never-signed-up').is(':checked');
    var inappropriate_val = $('#inappropriate').is(':checked');
    var spam_val = $('#spam').is(':checked');
    var other_check_val = $('#other').is(':checked');
    if (other_check_val == true) {
        var other_val = $('#other-answer-textarea').val();
    }
    else {
        var other_val = '';
    }

    $('.login-go-button-wrapper').remove();
    $('#cancel-wrapper').remove();
    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

    var json_data = {'newsletter':newsletter_val,'email_unsubscribe':email_unsubscribe_val, 'no_longer_want_to_receive':no_longer_want_to_receive_val, 'never_signed_up':never_signed_up_val, 'inappropriate':inappropriate_val, 'spam':spam_val, 'other':other_val};

    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/user/update-communication-preferences',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: update_communication_preferences_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
	    }
    })
        .fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'edit-communication-preferences-update-communication-preferences');
            switch (xhr.status) {
	        case 403:
	           // handle unauthorized
                if (token_retried == false) {
                    //console.log('retrying token');
                    token_retried = true;
                    $.get_token(update_communication_preferences);
                }
                else {
		        	$.display_page_fatal_error('edit-communication-preferences-form-wrapper');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('edit-communication-preferences-form-wrapper');
	           	break;
	    }	        
        });
};

update_communication_preferences_callback = function( data, textStatus, xhr ) {
	
    //console.log(data);
    //console.log('create_account_success called');
    if (data['update_communication_preferences'] == 'success') {
        //console.log('update_my_information success');
        window.location = '/account';
    }
    else if (data['update_communication_preferences'] == 'user_not_authenticated') {
        window.location = '/login?next=account/edit-communication-preferences&message=not-authenticated';
    }
    else {
	    $('.create-account-loader-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="login-go-button-wrapper"><input id="edit-communication-preferences-go" type="submit" class="login-go-button" value="SAVE"></div>');
	    $('#go-button-wrapper').append('<div id="cancel-wrapper" class="login-reset-password-wrapper"><a href="/account">Cancel - Back to My Account</a></div>');

        $('#edit-communication-preferences-go').click(function (event)
        {
            update_communication_preferences();
        });
    }
};
