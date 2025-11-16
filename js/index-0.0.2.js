window.startupwebapp = {};
// creating helper function so that I can mock it in unittests - See: https://stackoverflow.com/questions/4792281/mocking-window-location-href-in-javascript
window.startupwebapp.util = (
    function() {
        function get_window_location_hostname() {
            return window.location.hostname;
        }
        return { 
            get_window_location_hostname: get_window_location_hostname
        };
    })
();

$.user_logged_in = false;
$.client_event_id = null;
$.log_client_events = false;
$.env_vars = function () {
    var env_vars = [];
    var api_url = 'https://api.startupwebapp.com';

    switch(window.startupwebapp.util.get_window_location_hostname()) {
    case 'localhost':
        // Local development - accessed via localhost:8080
	    	api_url = 'http://localhost:8000';
	        break;
    case 'frontend':
        // Docker environment - frontend and backend in same network
	    	api_url = 'http://backend:60767';
	        break;
    case 'localliveservertestcase.startupwebapp.com':
	    	api_url = 'http://localliveservertestcaseapi.startupwebapp.com:60767';
	        break;
	    case 'localhost.startupwebapp.com':
	    	api_url = 'http://localapi.startupwebapp.com:8000';
	        break;
	    case 'dev.startupwebapp.com':
	    	api_url = 'https://devapi.startupwebapp.com';
	        break;
	    case 'www.startupwebapp.com':
	    	api_url = 'https://api.startupwebapp.com';
	        break;
	    default:
	        break;
    }

    env_vars['api_url'] = api_url;

    return env_vars;
};
var env_vars = $.env_vars();
var token_retried = false;
var terms_of_use_version = null;
var mb_cd = null;
var pr_cd = null;
var em_cd = null;
var ad_cd = null;

var member_first_name = null;
var member_last_name = null;
var member_email_address = null;

var chat_dialogue_name_field = null;
var chat_dialogue_email_address_field = null;
var chat_dialogue_message_field = null;

var chat_dialogue_name_error = null;
var chat_dialogue_email_address_error = null;
var chat_dialogue_message_error = null;

$(document).ready(function() {
    $('#header').load('/header.html', function() {
        //console.log( "Load was performed." );
        post_header();
    });	
    $('#header-prefix').load('/header-prefix.html', function() {
        //console.log( "header prefix load was performed." );
    });	

    $('body').on('click', function() {
        //console.log('body clicked');
        if (!$('.container-menu-expanded').hasClass('hide')) {
            $('.container-menu-expanded').toggleClass('hide');
        }
    });
});

post_header = function() {
	
    $('#header-logo').click(function() {
        window.location = '/';
    });

    $('#header-hamburger-menu').click(function(e) {
        $('.container-menu-expanded').toggleClass('hide');

        $('#chat-icon-close').addClass('hide');
        $('#chat-icon').removeClass('hide');
        $('#chat-dialogue-wrapper').addClass('hide');

        e.stopPropagation();
    });

    $('#header-account').click(function() {
        window.location = '/account';
    });

    $('#header-shopping-cart').click(function() {
        window.location = '/cart?referrer=' + window.location.pathname + '&query=' + $.urlParam('search') + '&tag=' + $.urlParam('tag');
    });

    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/user/logged-in',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: set_logged_in
    })
        .fail(function() {
	    //console.log('get logged-in failed. leaving as false');
            $.log_client_event('ajaxerror', 'index-logged-in', true);
        });

    $('#footerContent').load('/footer.html', function() {
        //console.log( "Load was performed." );
    });	
	
    /*
	var width = $(window).width();
	$(window).on('resize', function(){
		if($(this).width() != width){
			width = $(this).width();
			// position expanded hamburger menu based on header height
			//$('.container-menu-expanded').css('top', $('.container-header').outerHeight(true));
		}
	});
	*/


    /*****
	Setup Live Chat
	*****/

    $.get_token();

    chat_dialogue_name_field = $('#chat-dialogue-name');
    chat_dialogue_email_address_field = $('#chat-dialogue-email-address');
    chat_dialogue_message_field = $('#chat-dialogue-message');

    chat_dialogue_name_error = $('#chat-dialogue-name-error');
    chat_dialogue_email_address_error = $('#chat-dialogue-email-address-error');
    chat_dialogue_message_error = $('#chat-dialogue-message-error');

    $('#chat-icon').on('click', function(event){
        //console.log('chat icon clicked');
        event.stopPropagation();
        $.log_client_event('buttonclick', 'chat-icon', false);
        $('#chat-icon').addClass('hide');
        $('#chat-icon-close').removeClass('hide');
        $('#chat-dialogue-wrapper').removeClass('hide');
        if ($.user_logged_in == true) {
            $('#chat-dialogue-name').val(member_first_name + ' ' + member_last_name);
            $('#chat-dialogue-email-address').val(member_email_address);
        }
        if (!$('.container-menu-expanded').hasClass('hide')) {
            $('.container-menu-expanded').toggleClass('hide');
        }
    });

    $('#chat-icon-close').on('click', function(event){
        //console.log('chat icon close clicked');
        event.stopPropagation();
        $.log_client_event('buttonclick', 'chat-icon-close', false);
        $('#chat-icon-close').addClass('hide');
        $('#chat-icon').removeClass('hide');
        $('#chat-dialogue-wrapper').addClass('hide');
    });

    $.set_place_holder_listeners(chat_dialogue_name_field, 'Name *');
    $.set_place_holder_listeners(chat_dialogue_email_address_field, 'Email Address *');
    $.set_place_holder_listeners(chat_dialogue_message_field, 'Message *');

    //$.bind_key_to_form_submit_button(chat_dialogue_name_field, "enterKey", $('#submit-message-go'), 13);
    //$.bind_key_to_form_submit_button(chat_dialogue_email_address_field, "enterKey", $('#submit-message-go'), 13);
    //$.bind_key_to_form_submit_button(chat_dialogue_message_field, "enterKey", $('#submit-message-go'), 13);

    $('#submit-message-go').click(function (event)
    {
        submit_chat_message();
    });
    /*****
	End Setup Live Chat
	*****/

};


submit_chat_message = function() {
    //console.log('submit_chat_message clicked');

    chat_dialogue_name_field.attr('class', 'chat-dialogue-text-box');
    chat_dialogue_name_error.attr('class', 'chat-dialogue-error-text-hidden');
    chat_dialogue_name_error.empty();

    chat_dialogue_email_address_field.attr('class', 'chat-dialogue-text-box');
    chat_dialogue_email_address_error.attr('class', 'chat-dialogue-error-text-hidden');
    chat_dialogue_email_address_error.empty();

    chat_dialogue_message_field.attr('class', 'chat-dialogue-textarea');
    chat_dialogue_message_error.attr('class', 'chat-dialogue-error-text-hidden');
    chat_dialogue_message_error.empty();

    var name_val = chat_dialogue_name_field.val();
    var email_address_val = chat_dialogue_email_address_field.val();
    var message_val = chat_dialogue_message_field.val();

    var name_valid = $.isNameValid(name_val, 30);
    $.display_errors(name_valid, chat_dialogue_name_error, chat_dialogue_name_field, 'name', false, 'chat-dialogue-text-box-error', 'chat-dialogue-error-text');

    var email_address_valid = $.isEmailValid(email_address_val, 254);
    $.display_errors(email_address_valid, chat_dialogue_email_address_error, chat_dialogue_email_address_field, 'email_address', false, 'chat-dialogue-text-box-error', 'chat-dialogue-error-text');

    var message_valid = $.isChatMessageValid(message_val, 5000);
    $.display_errors(message_valid, chat_dialogue_message_error, chat_dialogue_message_field, 'message', false, 'chat-dialogue-text-box-error', 'chat-dialogue-error-text');

    if (name_valid.length == 0 && email_address_valid.length == 0 && message_valid.length == 0) {
	    $('.chat-dialogue-go-button-wrapper').remove();
	    $('#chat-dialogue-go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

        var json_data = {'name':name_val,
						 'email_address':email_address_val, 
						 'message':message_val
        };

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/put-chat-message',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: submit_chat_message_success,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    }
        })
            .fail(function() {
		    //console.log('post create account failed');
                $.log_client_event('ajaxerror', 'submit-chat-message');
		    $('#chat-dialogue-general-error').attr('class', 'chat-dialogue-error-text');
		    $('#chat-dialogue-general-error').empty();
		    $('.create-account-loader-wrapper').remove();
                $('#chat-dialogue-general-error').append("We\'re sorry. An error has occurred while submitting your message. Please refresh the page and try again. If that doesn\'t work, please clear browser cache and cookies and try reloading again.");
            });
    }

};

submit_chat_message_success = function( data, textStatus, xhr ) {
    //console.log(data);
    //console.log('submit_chat_message_success called');
    if (data['put_chat_message'] == 'true' || data['put_chat_message'] == 'email_failed') {
        //console.log('submit_chat_message_success success');
	    $('.create-account-loader-wrapper').remove();

        chat_dialogue_name_field.addClass('hide');
        chat_dialogue_email_address_field.addClass('hide');
        chat_dialogue_message_field.addClass('hide');

        chat_dialogue_name_error.addClass('hide');
        chat_dialogue_email_address_error.addClass('hide');
        chat_dialogue_message_error.addClass('hide');

        $('.chat-dialogue-header-intro').empty();
        $('.chat-dialogue-header-intro').append('Thank you. We got your message.');
        $('.chat-dialogue-header-message').empty();
        $('.chat-dialogue-header-message').append('We\'ll get back to you ASAP!');
	    $('#chat-dialogue-go-button-wrapper').append('<b>Name:</b> ' + chat_dialogue_name_field.val());
	    $('#chat-dialogue-go-button-wrapper').append('<br/><b>Email Address:</b> ' + chat_dialogue_email_address_field.val());
	    $('#chat-dialogue-go-button-wrapper').append('<br/><b>Message:</b><br><span class="respect-white-space">' + chat_dialogue_message_field.val() + '</span>');
	    console.log(chat_dialogue_message_field.val());

	    if (data['put_chat_message'] == 'email_failed') {
            $.log_client_event('ajaxerror', 'put-chat-message-email-failed');
	    }
    }
    else if (data['put_chat_message'] == 'validation_error') {
        //console.log('create_account succeeded but login failed');

	    $('.create-account-loader-wrapper').remove();

	    $('#chat-dialogue-go-button-wrapper').append('<div class="chat-dialogue-go-button-wrapper"><input id="submit-message-go" type="submit" class="chat-dialogue-go-button" value="SUBMIT MESSAGE"></div>');

        $('#submit-message-go').click(function (event)
        {
            submit_chat_message();
        });

        // show some error message
	    $('#chat-dialogue-general-error').attr('class', 'chat-dialogue-error-text');
	    $('#chat-dialogue-general-error').empty();
        $('#chat-dialogue-general-error').append('There was an error saving your message. Please check the values and try again. [E: 02]');

        for (var key in data['errors']) {
            $.display_errors(data['errors'][key], $('#chat-dialogue-' + key + '-error'), $('#chat-dialogue-' + key), key, false, 'chat-dialogue-text-box-error', 'chat-dialogue-error-text');
	    }
    }
};

set_logged_in = function( data, textStatus, xhr ) {
    //console.log('set_logged_in called');
    //console.log(window.location.search);
    //console.log(window.location.search.substr(1));
    if (data['logged_in'] == true) {
        $.user_logged_in = true;
        switch(window.location.pathname) {
		    case '/login':
		    case '/create-account':
		    case '/reset-password':
            window.location = '/account';
		        break;
        }		
    }

    if (data['log_client_events'] == true) {
        $.log_client_events = true;
    }
    if (data['client_event_id'] != 'null' && Number.isInteger(data['client_event_id'])) {
        $.client_event_id = data['client_event_id'];
    }

    $.log_client_event('pageview');
    //console.log'$.user_logged_in is ' + $.user_logged_in);

    if ($.urlParam('mb_cd') != null) {
        mb_cd = $.urlParam('mb_cd');
    }
    if ($.urlParam('pr_cd') != null) {
        pr_cd = $.urlParam('pr_cd');
    }
    if ($.urlParam('em_cd') != null) {
        em_cd = $.urlParam('em_cd');
    }
    if ($.urlParam('ad_cd') != null) {
        ad_cd = $.urlParam('ad_cd');
    }
    //console.log('mb_cd is ' + mb_cd);
    //console.log('pr_cd is ' + pr_cd);
    //console.log('em_cd is ' + em_cd);
    //console.log('ad_cd is ' + ad_cd);
    if ((em_cd != null || ad_cd != null) && (mb_cd !== null || pr_cd != null) || (ad_cd != null) ) {
        //console.log('FOUND link event query parameter combo');
        $.log_client_event('linkevent');
    }

    if (data['first_name'] != null) {
        member_first_name = data['first_name'];
    }
    if (data['last_name'] != null) {
        member_last_name = data['last_name'];
    }
    if (data['email_address'] != null) {
        member_email_address = data['email_address'];
    }

    $.set_cart_item_counter(data['cart_item_count']);

    $('#hamburger-menu-open').load('/menu.html', function() {
        switch(window.location.pathname) {
		    case '/':
		    case '/index.html':
		    	$('#menu-home-link').remove();
		        break;
		    case '/pythonabot':
		    	$('#menu-pythonabot-link').remove();
		        break;
		    case '/products':
		    	$('#menu-products-link').remove();
		        break;
		    case '/about':
		    	$('#menu-about-link').remove();
		        break;
		    case '/contact':
		    	$('#menu-contact-link').remove();
		        break;
		    case '/terms-of-use':
		    	$('#menu-terms-of-use-link').remove();
		        break;
		    case '/privacy-policy':
		    	$('#menu-privacy-policy-link').remove();
		        break;
		    case '/login':
		    	$('#menu-login-link').remove();
		        break;
        }

    	if ($.user_logged_in) {
    		//console.log('replace Login with Logout');
    		//<a id="menu-login-link" href="/login"><menu-item-expanded>Login</menu-item-expanded></a>
    		
    		if (data['member_initials'] != null) {
    			$('#header-account').append('<div id="header-account-initials" class="header-account-initials">' + data['member_initials'] + '</div>');
    		}			

    		$('#menu-login-link').remove();
    		var logout_link = $('<span class="menu-item-expanded-span"></span>');
            logout_link.attr('id', 'menu-logout-link');

            //<menu-item-expanded>Privacy Policy</menu-item-expanded>
    		var menu_item = $('<menu-item-expanded>Logout</menu-item-expanded>');
    		logout_link.append(menu_item);

    		$('#hamburger-menu-open').append(logout_link);

            $('#menu-logout-link').click(function (event)
            {
                //console.log("logout menu item clicked");

                $.ajax({
                    method: 'GET',
                    url: env_vars['api_url'] + '/user/logout',
                    dataType: 'html',
				    xhrFields: {
				        withCredentials: true
				    },
			        success: logout_successful
                })
                    .fail(function(xhr, textStatus, errorThrown) {
				    //console.log('logout failed');
                        $.log_client_event('ajaxerror', 'index-logout');
                        switch (xhr.status) {
				        default:
						    //console.log'populating header-error');
				        	$('#header-error').removeClass('hide');
				        	$('#header-error').empty();
				        	$('#header-error').append('We\'re sorry. You\'re request to logout failed. Please try again. If this error continues, please try refreshing the page and logging out again. If that fails, you can logout by clearing cookies from your browser.');
				           	break;
				    }	        
                    });
            });
            setTimeout(function(){
                $.check_termsofserviceisagreed_member();
            },1000); 			
    	}
    	else {
            $('#menu-account').attr('src','/img/account_white.1.png');			
            //console.log('anonymous user checking for terms of use cookie');
            setTimeout(function(){
                $.check_termsofserviceisagreed_cookie();
            },1000); 			
        }

    	$('#hamburger-menu-open').addClass('container-menu-expanded-' + $('#hamburger-menu-open').children().length);

        //$('#menu-logout-link').removeAttr('href');
    });	
};

$.check_termsofserviceisagreed_member = function () {
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/user/terms-of-use-agree-check',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: check_termsofserviceisagreed_member_success
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'terms-of-use-agree-check');
            //$.display_page_fatal_error('my-account-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });
};

check_termsofserviceisagreed_member_success = function( data, textStatus, xhr ) {
    //console.log(data);
    if (data['terms_of_use_agree_check'] == true) {
        //console.log('terms_of_use_agree_check is true');

        var termsofserviceagreed = $.getCookie('termsofserviceagreed');
        //console.log('termsofserviceagreed is "' + termsofserviceagreed + '"');
        if (termsofserviceagreed == null) {
            $.setCookie('termsofserviceagreed', 'true', 1825);
        }
    }
    else {
        //console.log('terms_of_use_agree_check is NOT true');		

        switch(window.location.pathname) {
		    case '/terms-of-use':
		    case '/privacy-policy':
		    case '/terms-of-sale':
		    case '/medical-disclaimer':
		    	//console.log('Terms of User Page or sub page');
		        break;
		    default:
            terms_of_use_version = data['version'];
            var updated_member_terms_of_use_agree = '<div class="full-screen-modal">' + 
															'<div id="updated_member_terms_of_use_agree_content" class="full-screen-modal-content">' +
																 '<div class="full-screen-modal-logo-wrapper">' +  
																	 '<img id="modal-logo" alt="rg" class="full-screen-modal-logo" src="/img/favicon.1.png" title="Logo">' +
																 '</div>' + 
																 '<br/><br/>' + 
																 'Sorry for the interruption. But, this is important :)' + 
																 '<br/><br/>' + 
																 'We\'ve updated our our <a href="/terms-of-use" target="_blank">Terms of Use</a> including our use of cookies and our <a href="/privacy-policy" target="_blank">Privacy Policy</a>. Regulatory agencies require that we inform you of these changes and that you accept them before you can continue to use StartupWebApp.com.' + 
																 '<br/><br/>' + 
																 data['version_note'] + 
																 '<br/><br/>' + 
																 'Please review the updated policies and submit this form to acknowledge your acceptance of these changes. If you have any questions about these policies you can contact us at <a href="mailto:contact@startupwebapp.com?Subject=Terms of Use Question" target="_top">contact@StartupWebApp.com</a>.' + 
																 '<br/>' + 
																 '<br/>' + 
																	 '<input type="checkbox" class="login-remember-me-checkbox" id="member-terms-of-use-agree" title="Agree to Terms of Use and Privacy Policy">&nbsp;<u>I have read and agree to the <a href="/terms-of-use" target="_blank">Terms of Use</a> including our use of cookies and our <a href="/privacy-policy" target="_blank">Privacy Policy</a></u>' + 
																	 '<br/>' + 
																	 '<br/>' + 
			                                						 '<div id="member-terms-of-use-agree-error" class="login-form-error-text-hidden"></div>' +
																	 '<br/>' + 
									                                 '<div id="terms-go-button-wrapper">' + 
									                                    '<div class="terms-go-button-wrapper">' + 
											                                '<input id="agree-terms-of-use" type="submit" class="login-go-button" value="AGREE AND CONTINUE">' + 
									                                    '</div>' + 
									                                 '</div>' + 
															 '</div>' +
														 '</div>';
            var $updated_member_terms_of_use_agree_div = $(updated_member_terms_of_use_agree).appendTo('body');
            $updated_member_terms_of_use_agree_div.attr('id', 'updated_member_terms_of_use_agree-div');	
            $('#agree-terms-of-use').click(function() {
                member_terms_and_conditions_agree_action();
            });		
        }
    }
};

member_terms_and_conditions_agree_action = function () {
    //console.log('$.member_terms_and_conditions_agree_action clicked');
    var member_terms_of_use_agree_val = 'false';
    if ($('#member-terms-of-use-agree').is(':checked')) {
        member_terms_of_use_agree_val = 'true';
    }
    var member_terms_of_use_agree_valid = $.isTermsOfUseAgreeValid(member_terms_of_use_agree_val);
    var member_terms_of_use_agree_field = $('#member-terms-of-use-agree');
    var member_terms_of_use_agree_error = $('#member-terms-of-use-agree-error');
    member_terms_of_use_agree_error.attr('class', 'login-form-error-text-hidden');
    member_terms_of_use_agree_error.empty();

    $.display_errors(member_terms_of_use_agree_valid, member_terms_of_use_agree_error, member_terms_of_use_agree_field, 'member_terms_of_use_agree', true);

    if (member_terms_of_use_agree_val == 'true') {
        //console.log('good to go');

	    $('.terms-go-button-wrapper').remove();
	    $('#terms-go-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

        var json_data = {'version':terms_of_use_version};
        //var json_data = {"version":1};

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/user/terms-of-use-agree',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
            success: member_terms_and_conditions_agree_action_success,
            beforeSend: function(request) {
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    }
        })
            .fail(function(xhr, textStatus, errorThrown) {
		    //console.log('post member_terms_and_conditions_agree_action failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'terms-of-use-agree');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(member_terms_and_conditions_agree_action);
                    }
                    else {
			        	$.display_page_fatal_error('updated_member_terms_of_use_agree_content');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('updated_member_terms_of_use_agree_content');
		           	break;
		    }	        
            });		
    }

};

member_terms_and_conditions_agree_action_success = function ( data, textStatus, xhr ) {
    //console.log('$.member_terms_and_conditions_agree_action_successs clicked');
    if (data['terms_of_use_agree'] == 'success') {
        $('#updated_member_terms_of_use_agree-div').remove();
        var termsofserviceagreed = $.getCookie('termsofserviceagreed');
        //console.log('termsofserviceagreed is "' + termsofserviceagreed + '"');
        if (termsofserviceagreed == null) {
            $.setCookie('termsofserviceagreed', 'true', 1825);
        }
    }	
    else {
        $('.create-account-loader-wrapper').remove();
	    $('#terms-go-button-wrapper').append('<div class="action-message">There was an error saving your data. Please reload the page and try again.</div>');
        switch(data['errors']['error']) {
		    case 'version-already-agreed':
            $.log_client_event('ajaxerror', 'terms-of-use-agree-version-already-agreed');
		        break;
		    case 'version-provided-not-most-recent':
            $.log_client_event('ajaxerror', 'terms-of-use-agree-version-provided-not-most-recent');
		        break;
		    case 'version-not-found':
            $.log_client_event('ajaxerror', 'terms-of-use-agree-version-not-found');
		        break;
		    case 'version-required':
            $.log_client_event('ajaxerror', 'terms-of-use-agree-version-required');
		        break;
		    default:
            $.log_client_event('ajaxerror', 'terms-of-use-agree-undefined');
		        break;
	    }
    }
};

$.check_termsofserviceisagreed_cookie = function () {
    //console.log('check_termsofserviceisagreed_cookie called');
    var termsofserviceagreed = $.getCookie('termsofserviceagreed');
    //console.log('termsofserviceagreed is "' + termsofserviceagreed + '"');
    if (termsofserviceagreed == null) {
        //console.log('termsofserviceagreed IS NOT set');

        $('#chat-icon').addClass('hide');
        $('#chat-icon-close').addClass('hide');
        $('#chat-dialogue-wrapper').addClass('hide');

        $('#terms-and-conditions-agree-div').removeClass('hide');
        $('.footer-fixed-action-link').click(function() {
            $.terms_and_conditions_agree_action();
        });		
    }
};

$.terms_and_conditions_agree_action = function () {
    //console.log('terms_and_conditions_agree_action called');
    $('#terms-and-conditions-agree-div').addClass('hide');
    $.setCookie('termsofserviceagreed', 'true', 1825);

    $('#chat-icon').removeClass('hide');

};

logout_successful = function( data, textStatus, xhr ) {
    //console.log('logout successful');
    window.location = '/login';
};

$.urlParam = function(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results != null) {
        return results[1] || 0;
    }
    else {
        return null;
    }
};

$.getCookie = function(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

$.log_client_event = function(event_type, error_id, log_client_events_override) {
    //console.log("event_type is " + event_type);
    //console.log("error_id is " + error_id);
    //console.log('cookie is ' + $.getCookie('anonymousclientevent'));
    if(error_id === undefined) {error_id = null;}
    if ($.getCookie('anonymousclientevent') != '') {
        $.anonymous_id = $.getCookie('anonymousclientevent');
    }
    //console.log("$.log_client_events is " + $.log_client_events);
    if ($.log_client_events == true || log_client_events_override == true) {
        //console.log("$.client_event_id is " + $.client_event_id);
        switch(event_type) {
		    case 'pageview':
            $.get( env_vars['api_url'] + '/clientevent/pageview?client_event_id=' + $.client_event_id + '&anonymous_id=' +  $.anonymous_id + '&url=' +  encodeURIComponent(window.location.href) + '&pageWidth=' + $(window).width());
		        break;
		    case 'ajaxerror':
            //console.log("ajaxerror");
            $.get( env_vars['api_url'] + '/clientevent/ajaxerror?client_event_id=' + $.client_event_id + '&anonymous_id=' +  $.anonymous_id + '&url=' +  encodeURIComponent(window.location.href) + '&error_id=' +  error_id);
		        break;
		    case 'buttonclick':
            $.get( env_vars['api_url'] + '/clientevent/buttonclick?client_event_id=' + $.client_event_id + '&anonymous_id=' +  $.anonymous_id + '&url=' +  encodeURIComponent(window.location.href) + '&button_id=' +  error_id);
		        break;
		    case 'linkevent':
            //console.log("linkevent");
            $.get( env_vars['api_url'] + '/clientevent/linkevent?mb_cd=' + mb_cd + '&pr_cd=' + pr_cd + '&anonymous_id=' +  $.anonymous_id + '&em_cd=' + em_cd + '&ad_cd=' + ad_cd + '&url=' +  encodeURIComponent(window.location.href));
		        break;
		    default:
		        break;
        }
    }
};

Number.isInteger = Number.isInteger || function(value) {
    return typeof value === 'number' && 
           isFinite(value) && 
           Math.floor(value) === value;
};
