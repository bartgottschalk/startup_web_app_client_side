var csrftoken;
var env_vars = $.env_vars();
var general_error = $('#email-unsubscribe-general-error');
var token_retried = false;
var email_unsubscribe_token = '';

$(document).ready(function() {
    //console.log(env_vars);	
    //console.log($.urlParam('token'));
    var token_url_string = '';
    if ($.urlParam('token') != null) {
        email_unsubscribe_token = $.urlParam('token');
        token_url_string = '?token=' + email_unsubscribe_token;
    }
    else if ($.urlParam('pr_token') != null) {
        email_unsubscribe_token = $.urlParam('pr_token');
        token_url_string = '?pr_token=' + email_unsubscribe_token;
    }
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/user/email-unsubscribe-lookup' + token_url_string,
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_email_unsubscribe
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'email-unsubscribe-token-lookup');
            $.display_page_fatal_error('email-unsubscribe-form-wrapper', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });

    set_up_email_unsubscribe_form_listeners();
});

load_email_unsubscribe = function( data, textStatus, xhr ) {
    //console.log(data);

    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    if (data['email_unsubscribe_lookup'] == 'success') {
        $('#email-unsubscribe-email-address').html(data['email_address']);
        if ($.urlParam('token') != null) {
            $('#email-unsubscribe-intro-text').html('Please confirm that you want the following email address unsubscribed from newsletters and marketing communication.<br/><br/>Please note that after unsubscribing, this email address may still recieve operational messages from StartupWebApp if you use this email address for orders, subscriptions or similar activities.');
            $('#email-unsubscribe-alternative-text').html('Alternatively, you may <a href="/account/edit-communication-preferences">change your communication preferences</a>.');
        }
        else if ($.urlParam('pr_token') != null) {
            $('#email-unsubscribe-intro-text').html('Please confirm that you want the following email address unsubscribed from newsletters and marketing communication.');
            $('#email-unsubscribe-alternative-text').html('');
        }
    }
    else {
        $('#email-unsubscribe-intro-text').remove();
        $('#email-unsubscribe-email-address-wrapper').remove();
        $('#email-unsubscribe-alternative-text').remove();
        $('#go-button-wrapper').remove();
        $('#cancel-button-wrapper').remove();

        if (data['errors']['error'] == 'token-invalid') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('This email address is either not in our system or the email address has already been unsubscribed. [E: 01]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-lookup-token-invalid', true);
        }
        else if (data['errors']['error'] == 'token-altered') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('This email address is either not in our system or the email address has already been unsubscribed. [E: 02]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-lookup-token-altered', true);
        }
        else if (data['errors']['error'] == 'member-not-found') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('This email address is either not in our system or the email address has already been unsubscribed. [E: 03]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-lookup-member-not-found', true);
        }
        else if (data['errors']['error'] == 'token-required') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('This email address is either not in our system or the email address has already been unsubscribed. [E: 04]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-lookup-token-required', true);
        }
        else if (data['errors']['error'] == 'email-address-already-unsubscribed') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('This email address is either not in our system or the email address has already been unsubscribed. [E: 05]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-lookup-email-address-already-unsubscribed', true);
        }
        else {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 06]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-lookup-undefined', true);
        }
    }

    $.get_token();
};

set_up_email_unsubscribe_form_listeners = function() {
    //console.log('set_up_create_account_form_listeners called');

    $('#email-unsubscribe-go').click(function (event)
    {
        email_unsubscribe_confirm();
    });

    $('#email-unsubscribe-cancel').click(function() {
        window.location = '/account';
    });

};

email_unsubscribe_confirm = function() {
    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    $('#go-button-wrapper').empty();
    $('#cancel-button-wrapper').empty();
    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

    if ($.urlParam('token') != null) {
        var json_data = {'token':email_unsubscribe_token};
    }
    else if ($.urlParam('pr_token') != null) {
        var json_data = {'pr_token':email_unsubscribe_token};
    }
	
    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/user/email-unsubscribe-confirm',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: email_unsubscribe_confirm_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', csrftoken);
	    }
    })
        .fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'email-unsubscribe-confirm');
            switch (xhr.status) {
	        case 403:
	           // handle unauthorized
                if (token_retried == false) {
                    //console.log('retrying token');
                    token_retried = true;
                    $.get_token(email_unsubscribe_confirm);
                }
                else {
		        	$.display_page_fatal_error('email-unsubscribe-form-wrapper');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('email-unsubscribe-form-wrapper');
	           	break;
	    }	        
        });
};

check_if_reason_selected = function() {
    //console.log('check_if_reason_selected called');

    var no_longer_want_to_receive_val = $('#no-longer-want-to-receive').is(':checked');
    var never_signed_up_val = $('#never-signed-up').is(':checked');
    var inappropriate_val = $('#inappropriate').is(':checked');
    var spam_val = $('#spam').is(':checked');
    var other_check_val = $('#other').is(':checked');
    var other_val = $('#other-answer-textarea').val();

    if (no_longer_want_to_receive_val == true || never_signed_up_val == true || inappropriate_val == true || spam_val == true || (other_check_val == true && other_val != '')) {
        $('#email-unsubscribe-why-go').removeClass('login-go-button-disabled');
        $('#email-unsubscribe-why-go').off( 'click');	
        $('#email-unsubscribe-why-go').click(function (event) {
            email_unsubscribe_why();
        });	
    }
    else {
        $('#email-unsubscribe-why-go').addClass('login-go-button-disabled');
        $('#email-unsubscribe-why-go').off( 'click');	
    }
};

email_unsubscribe_confirm_callback = function( data, textStatus, xhr ) {	
    //console.log(data);
    //console.log('create_account_success called');
    if (data['email_unsubscribe_confirm'] == 'success') {
        // get new token value so that I can use it in the why POST
        email_unsubscribe_token = data['token'];
        //console.log('email_unsubscribe_confirm_callback success');
        if ($.urlParam('token') != null) {
            $('#email-unsubscribe-intro-text').html('<h2>Unsubscribe Successful</h2>The following email address has been successfully unsubscribed from newsletters and marketing communication.<br><br>Please note that this email address may still recieve operational messages from StartupWebApp if you use this email address for orders, subscriptions or similar activities.');
        }
        else if ($.urlParam('pr_token') != null) {
            $('#email-unsubscribe-intro-text').html('<h2>Unsubscribe Successful</h2>The following email address has been successfully unsubscribed from newsletters and marketing communication.');
        }
        $('#email-unsubscribe-email-address').html(data['email_address']);
        //$('#email-unsubscribe-alternative-text').empty();
        $('#email-unsubscribe-alternative-text').html('<h3>If you have a moment, please let us know why you unsubscribed:</h3>' + 
														   '<input type="checkbox" class="login-remember-me-checkbox" id="no-longer-want-to-receive" title="I no longer want to receive these emails"/>&nbsp;I no longer want to receive these emails<br>' + 
														   '<input type="checkbox" class="login-remember-me-checkbox" id="never-signed-up" title="I never signed up for this mailing list"/>&nbsp;I never signed up for this mailing list<br>' + 
														   '<input type="checkbox" class="login-remember-me-checkbox" id="inappropriate" title="The emails are inappropriate"/>&nbsp;The emails are inappropriate<br>' + 
														   '<input type="checkbox" class="login-remember-me-checkbox" id="spam" title="The emails are spam and should be reported"/>&nbsp;The emails are spam and should be reported<br>' + 
														   '<input type="checkbox" class="login-remember-me-checkbox" id="other" title="Other (fill in reason below)"/>&nbsp;Other (fill in reason below)' + 
										                   '<textarea id="other-answer-textarea" name="other-answer-textarea" class="login-form-error-text-hidden"></textarea>');

        $('#no-longer-want-to-receive').change(function() {check_if_reason_selected();});
        $('#never-signed-up').change(function() {check_if_reason_selected();});
        $('#inappropriate').change(function() {check_if_reason_selected();});
        $('#spam').change(function() {check_if_reason_selected();});
        $('#other-answer-textarea').keyup(function() {check_if_reason_selected();});
        $('#other').change(function() {
            check_if_reason_selected();
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

        $('#go-button-wrapper').empty();
        $('#go-button-wrapper').html('<div class="login-go-button-wrapper"><input id="email-unsubscribe-why-go" type="submit" class="login-go-button login-go-button-disabled" value="SUBMIT"/></div>');
        $('#cancel-button-wrapper').empty();
        $('#cancel-button-wrapper').append('<div id="cancel-wrapper" class="login-reset-password-wrapper"><a href="/">View Home Page</a></div>');
    }
    else {
        if (data['errors']['error'] == 'token-invalid') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 11]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-confirm-token-invalid');
        }
        else if (data['errors']['error'] == 'token-altered') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 12]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-confirm-token-altered');
        }
        else if (data['errors']['error'] == 'member-not-found') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 13]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-confirm-member-not-found');
        }
        else if (data['errors']['error'] == 'token-required') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 14]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-confirm-token-required');
        }
        else if (data['errors']['error'] == 'email-address-already-unsubscribed') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 15]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-confirm-email-address-already-unsubscribed');
        }
        else {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 16]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-confirm-undefined');
        }


	    $('.create-account-loader-wrapper').remove();
	    $('#go-button-wrapper').append('<div class="login-go-button-wrapper"><input id="email-unsubscribe-go" type="submit" class="login-go-button" value="YES, REMOVE ME"/></div>');
	    $('#cancel-button-wrapper').append('<div class="login-go-button-wrapper"><input id="email-unsubscribe-cancel" type="submit" class="cancel-button" value="No, Keep Me On Your List"/></div>');

        $('#email-unsubscribe-go').click(function (event)
        {
            email_unsubscribe_confirm();
        });

        $('#email-unsubscribe-cancel').click(function() {
            window.location = '/account';
        });
    }
};

email_unsubscribe_why = function() {
    general_error.attr('class', 'login-form-error-text-hidden');
    general_error.empty();

    $('#go-button-wrapper').empty();
    $('#cancel-button-wrapper').empty();
    $('#go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

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

    if ($.urlParam('token') != null) {
        var json_data = {'token':email_unsubscribe_token, 'no_longer_want_to_receive':no_longer_want_to_receive_val, 'never_signed_up':never_signed_up_val, 'inappropriate':inappropriate_val, 'spam':spam_val, 'other':other_val};
    }
    else if ($.urlParam('pr_token') != null) {
        var json_data = {'pr_token':email_unsubscribe_token, 'no_longer_want_to_receive':no_longer_want_to_receive_val, 'never_signed_up':never_signed_up_val, 'inappropriate':inappropriate_val, 'spam':spam_val, 'other':other_val};
    }
		
    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/user/email-unsubscribe-why',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: email_unsubscribe_why_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', csrftoken);
	    }
    })
        .fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'email-unsubscribe-why');
            switch (xhr.status) {
	        case 403:
	           // handle unauthorized
                if (token_retried == false) {
                    //console.log('retrying token');
                    token_retried = true;
                    $.get_token(email_unsubscribe_confirm);
                }
                else {
		        	$.display_page_fatal_error('email-unsubscribe-form-wrapper');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('email-unsubscribe-form-wrapper');
	           	break;
	    }	        
        });
};

email_unsubscribe_why_callback = function( data, textStatus, xhr ) {	
    //console.log(data);
    //console.log('create_account_success called');
    if (data['email_unsubscribe_why'] == 'success') {
        //console.log('email_unsubscribe_why_callback success');
	    $('.create-account-loader-wrapper').remove();
        $('#email-unsubscribe-alternative-text').empty();
        $('#email-unsubscribe-alternative-text').append('<h3>Your feedback has been received. Thank you.<h3>');
        $('#cancel-button-wrapper').empty();
        $('#cancel-button-wrapper').append('<div id="cancel-wrapper" class="login-reset-password-wrapper"><a href="/">View Home Page</a></div>');		
    }
    else {
        if (data['errors']['error'] == 'token-invalid') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 11]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-why-token-invalid');
        }
        else if (data['errors']['error'] == 'token-altered') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 12]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-why-token-altered');
        }
        else if (data['errors']['error'] == 'member-not-found') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 13]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-why-member-not-found');
        }
        else if (data['errors']['error'] == 'token-required') {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 14]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-why-token-required');
        }
        else {
            general_error.attr('class', 'login-form-error-text');
            general_error.append('There was an error while processing your request. Please try again. [E: 16]');
            $.log_client_event('ajaxerror', 'email-unsubscribe-why-undefined');
        }


	    $('.create-account-loader-wrapper').remove();

        $('#go-button-wrapper').empty();
        $('#go-button-wrapper').html('<div class="login-go-button-wrapper"><input id="email-unsubscribe-why-go" type="submit" class="login-go-button" value="SUBMIT"/></div>');
        $('#email-unsubscribe-why-go').click(function (event)
        {
            email_unsubscribe_why();
        });
        $('#cancel-button-wrapper').empty();
        $('#cancel-button-wrapper').append('<div id="cancel-wrapper" class="login-reset-password-wrapper"><a href="/">View Home Page</a></div>');

    }
};
