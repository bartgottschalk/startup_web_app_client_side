// Checkout success page - processes Stripe Checkout Session success
var env_vars = $.env_vars();

$(document).ready(function() {
    // Extract session_id from URL parameter
    var session_id = $.urlParam('session_id');

    if (!session_id) {
        // No session_id - show error
        show_error('Missing session ID. Please contact support if you completed a payment.');
        return;
    }

    // Call backend to process the checkout session
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/checkout-session-success?session_id=' + session_id,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: handle_checkout_success
    })
        .fail(function(xhr, textStatus, errorThrown) {
            //console.log('checkout-session-success failed');
            //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'order-checkout-session-success');

            switch (xhr.status) {
            case 404:
                show_error('Checkout session not found. Please contact support if you completed a payment.');
                break;
            case 500:
                show_error('An error occurred while processing your order. Please contact support.');
                break;
            default:
                show_error('An unexpected error occurred. Please contact support if you completed a payment.');
                break;
            }
        });
});

var handle_checkout_success = function(data, textStatus, xhr) {
    //console.log(data);

    if (data['checkout_session_success'] == 'success') {
        //console.log('checkout_session_success successful');
        //console.log('order_identifier is ' + data['order_identifier']);

        // Redirect to order detail page (same as old flow)
        window.location = '/account/order?identifier=' + data['order_identifier'];
    }
    else {
        //console.log('handle_checkout_success error');
        var error_message = 'An error occurred while processing your order.';

        if (data['errors'] && data['errors']['error']) {
            if (data['errors']['error'] == 'session-not-found') {
                error_message = 'Checkout session not found. Please contact support if you completed a payment.';
            }
            else if (data['errors']['error'] == 'invalid-session-id') {
                error_message = 'Invalid checkout session. Please contact support if you completed a payment.';
            }
            else if (data['errors']['description']) {
                error_message = data['errors']['description'];
            }
        }

        show_error(error_message);
        $.log_client_event('ajaxerror', 'checkout-session-success-error-' + (data['errors'] ? data['errors']['error'] : 'unknown'));
    }
};

var show_error = function(message) {
    $('#success-message').addClass('hide');
    $('#success-error .information-item').html(message);
    $('#success-error').removeClass('hide');
};
