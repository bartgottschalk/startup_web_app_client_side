// other global variables
var env_vars = $.env_vars();
var token_retried = false;
var stripe_checkout_handler = null;
var stripe_payment_token = null;
var stripe_payment_args = null;
var number_of_items_in_order = 0;
var confirm_total_raw = null;
var confirm_total_formatted = null;
var cart_item_count = 0;
var cart_contains_backordered_out_of_stock_item = false;
var cart_item_quantity = 0;

var anonymous_email_address_field = $('#confirm-anonymous-email-address');
var anonymous_email_address_error = $('#confirm-anonymous-email-address-error');

var confirm_order_terms_of_sale_agree_field = $('#confirm-order-terms-of-sale-agree');
var confirm_order_terms_of_sale_agree_error = $('#confirm-order-terms-of-sale-agree-error');

var confirm_order_payment_shipping_error = $('#confirm-order-payment-shipping-error');

$(document).ready(function() {
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/checkout-allowed',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: checkout_allowed_callback
    })
        .fail(function() {
            $.log_client_event('ajaxerror', 'order-checkout-allowed', true);
        });
});

checkout_allowed_callback = function( data, textStatus, xhr ) {
    //console.log('checkout_allowed_callback called');
    //console.log(data);
    if (data['checkout_allowed'] == true) {
        $.ajax({
            method: 'GET',
            url: env_vars['api_url'] + '/order/confirm-items',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
	        success: load_confirm_items
        })
            .fail(function() {
		    //console.log('get account_content failed');
                $.log_client_event('ajaxerror', 'confirm-items');
                $.display_page_fatal_error('confirm-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
            });

        $.ajax({
            method: 'GET',
            url: env_vars['api_url'] + '/order/confirm-shipping-method',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
	        success: load_confirm_shipping_methods
        })
            .fail(function() {
		    //console.log('get account_content failed');
                $.log_client_event('ajaxerror', 'confirm-shipping-method');
                $.display_page_fatal_error('confirm-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
            });

        $.ajax({
            method: 'GET',
            url: env_vars['api_url'] + '/order/confirm-discount-codes',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
	        success: load_confirm_discount_codes
        })
            .fail(function() {
		    //console.log('get account_content failed');
                $.log_client_event('ajaxerror', 'confirm-discount-codes');
                $.display_page_fatal_error('confirm-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
            });
    }
    else {
        //console.log('show confirm empty');
        $('#item-information-sub-header').remove();
        $('#item-information-detail-wrapper').remove();
        $('#shipping-cost-sub-header').remove();
        $('#shipping-information').remove();
        $('#discount-codes-sub-header').remove();
        $('#discount-codes-new').remove();
        $('#discount-code-detail-wrapper').remove();
        $('#confirm-total-sub-header').remove();
        $('#confirm-total-detail-wrapper').remove();
        $('.confirm-order-agree-terms-of-sale-wrapper').remove();
        $('#confirm-checkout-button-wrapper-bottom').remove();
        $('#login-create-account-continue-anon-subheader').remove();
        $('#login-create-account-continue-anon-wrapper').remove();

        $('#confirm-information-wrapper').append('<div class="information-item information-item-note">Under Construction. We\'re building this feature at the moment. Please check back again soon!</div>');
        $('#confirm-detail-body').append('<img alt="Under Construction" class="under-construction" src="/img/under_construction.jpg">');

        //console.log('checkout_allowed is FALSE - show under construction');
    }
};

load_confirm_items = function( data, textStatus, xhr ) {
    //console.log(data);

    if ($.user_logged_in) {
        $('#enter-payment-information-button-wrapper').removeClass('hide');
        $('#confirm-order-agree-terms-of-sale').removeClass('hide');
        $('#confirm-checkout-button-wrapper-bottom').removeClass('hide');
    }
    else {
        $('#confirm-checkout-button-wrapper-bottom').prepend('<div class="confirm-order-agree-terms-of-sale-wrapper confirm-order-sign-up-for-marketing-email-wrapper"><input type="checkbox" class="confirm-order-agree-terms-of-sale-checkbox" id="confirm-order-sign-up-for-marketing-emails" title="Sign Up for Markeing Emails">&nbsp;Sign up to receive marketing emails from StartupWebApp.com according to our <a href="/terms-of-use" target="_blank">Terms of Use</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.</div>');
        $('#login-create-account-continue-anon-subheader').removeClass('hide');
        $('#login-create-account-continue-anon-wrapper').removeClass('hide');
        $('#save-shipping-and-billing-info').addClass('hide');
    }

    if (data['cart_found'] == true) {
        for (var product_sku in data['item_data']['product_sku_data']) {
            var color = data['item_data']['product_sku_data'][product_sku]['color'];
            var description = data['item_data']['product_sku_data'][product_sku]['description'];
            var parent_product__title = data['item_data']['product_sku_data'][product_sku]['parent_product__title'];
            var parent_product__title_url = data['item_data']['product_sku_data'][product_sku]['parent_product__title_url'];
            var parent_product__identifier = data['item_data']['product_sku_data'][product_sku]['parent_product__identifier'];
            var price = data['item_data']['product_sku_data'][product_sku]['price'];
            var quantity = data['item_data']['product_sku_data'][product_sku]['quantity'];
            var size = data['item_data']['product_sku_data'][product_sku]['size'];
            var sku_id = data['item_data']['product_sku_data'][product_sku]['sku_id'];
            var sku_image_url = data['item_data']['product_sku_data'][product_sku]['sku_image_url'];
            var sku_inventory__title = data['item_data']['product_sku_data'][product_sku]['sku_inventory__title'];
            var sku_inventory__identifier = data['item_data']['product_sku_data'][product_sku]['sku_inventory__identifier'];

            var item_image_str = '<img alt="' + parent_product__title + '" class="cart-detail-item-image" src="' + sku_image_url + '"></img>';
            var item_price_each_formatted = '$' + price.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            var item_subtotal = price * quantity;
            var item_subtotal_formatted = '$' + item_subtotal.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            var item_image_str = '<a href="/product?name=' + parent_product__title_url + '&id=' + parent_product__identifier + '&referrer=/cart"><img alt="' + parent_product__title + '" class="cart-details-item-image" src="' + sku_image_url + '"></img></a>';

            var sku_title_str = parent_product__title;
            if (description != null) {
                sku_title_str += ', ' + description;
            }
            if (color != null) {
                sku_title_str += ', ' + color;
            }
            if (size != null) {
                sku_title_str += ', ' + size;
            }
            var title_full_link_str = '<a href="/product?name=' + parent_product__title + '&id=' + parent_product__identifier + '&referrer=/cart">' + sku_title_str + '</a>';
            $('#sku-table').append('<tr id="sku_row_' + sku_id + '"><td class="cart-details-item-table-image">' + item_image_str + '</td><td class="cart-details-item-table-title">' + title_full_link_str + '&nbsp;<span class="cart-inventory-note">[' + sku_inventory__title + ']</span>' + '</td><td id="sku_price_' + sku_id + '" class="cart-details-item-table-price" sku_price="' + price + '">' + item_price_each_formatted + '</td><td class="cart-details-item-table-quantity">' + quantity + '</div></td><td id="sku_subtotal_' + sku_id + '" class="cart-details-item-table-price">' + item_subtotal_formatted + '</td></tr>');

            number_of_items_in_order += 1;
            cart_item_count += 1;
            cart_item_quantity += quantity;
            if (sku_inventory__identifier != 'in-stock') {
                cart_contains_backordered_out_of_stock_item = true;
            }
        }

        $.get_token();
        cart_check_for_valid_checkout_conditions();

        $.ajax({
            method: 'GET',
            url: env_vars['api_url'] + '/order/confirm-totals',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
	        success: load_confirm_totals
        })
            .fail(function() {
		    //console.log('get account_content failed');
                $.log_client_event('ajaxerror', 'confirm-totals');
                $.display_page_fatal_error('confirm-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
            });

        set_up_confirm_form_listeners();

        $('#confirm-detail-body').removeClass('hide');

    }
    else {
        //console.log('show confirm empty');
        $('#item-information-sub-header').remove();
        $('#item-information-detail-wrapper').remove();
        $('#shipping-cost-sub-header').remove();
        $('#shipping-information').remove();
        $('#discount-codes-sub-header').remove();
        $('#discount-codes-new').remove();
        $('#discount-code-detail-wrapper').remove();
        $('#confirm-total-sub-header').remove();
        $('#confirm-total-detail-wrapper').remove();
        $('.confirm-order-agree-terms-of-sale-wrapper').remove();
        $('#confirm-checkout-button-wrapper-bottom').remove();
        $('#login-create-account-continue-anon-subheader').remove();
        $('#login-create-account-continue-anon-wrapper').remove();
        $('#enter-payment-information-button-wrapper').remove();

        $('#confirm-detail-body').removeClass('hide');

        $('#confirm-detail-body').append('<div id="confirm-empty-sub-header" class="cart-sub-header">SHOPPING CART IS EMPTY</div>' + 
									  '<div id="confirm-empty-detail-wrapper" class="account-section-details cart-empty-links">Please browse <a href="/products" title="Browse Products">Products</a> to continue shopping.</div></div>');
    }
};

load_confirm_shipping_methods  = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['cart_found'] == true) {
        var carrier = data['confirm_shipping_method']['carrier'];
        var shipping_cost = data['confirm_shipping_method']['shipping_cost'];
        var shipping_cost_formatted = '$' + shipping_cost.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
        var shipping_method_str = '<div class="confirm-detail-line">' + carrier + '&nbsp;' + shipping_cost_formatted + '</div>';
        $('#shipping-methods').append(shipping_method_str);
    }
};

load_confirm_discount_codes = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['cart_found'] == true) {
        $('#discount-code-table').find('tr:gt(0)').remove();

        for (var discount_code in data['discount_code_data']) {
            var code = data['discount_code_data'][discount_code]['code'];
            var combinable = data['discount_code_data'][discount_code]['combinable'];
            var description = data['discount_code_data'][discount_code]['description'];
            var discount_amount = data['discount_code_data'][discount_code]['discount_amount'];
            var discount_code_id = data['discount_code_data'][discount_code]['discount_code_id'];
            var discount_applied = data['discount_code_data'][discount_code]['discount_applied'];

            var combinable_str = 'No';
            if (combinable == true) {
                combinable_str = 'Yes';
            }

            var value_str = description;
            value_str = value_str.replace('{}', discount_amount);

            var strikethrough_class = '';
            var wont_be_applied_str = '';
            if (discount_applied == false) {
                strikethrough_class = ' strikethrough';
                wont_be_applied_str = '<span class="cart-inventory-note"> [This code cannot be combined or does not qualify for your order.]</span>';
            }

            $('#discount-code-table').append('<tr id="discount_code_row_' + discount_code_id + '"><td class="cart-details-item-table-title' + strikethrough_class + '">' + code + wont_be_applied_str + '</td><td class="cart-details-item-table-title' + strikethrough_class + '">' + value_str + '</td><td class="cart-details-item-table-quantity' + strikethrough_class + '">' + combinable_str + '</td></tr>');
        }
        if ($('#discount-code-table tr').length <= 1) {
            $('#discount-codes-sub-header').addClass('hide');
            $('#discount-code-detail-wrapper').addClass('hide');
        }
    }
};

load_confirm_totals = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['cart_found'] == true) {
        $('#confirm-total-table').find('tr').remove();

        var item_subtotal_formatted = '$' + data['confirm_totals_data']['item_subtotal'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
        $('#confirm-total-table').append('<tr><td class="cart-totals-item-table-title">Item Subtotal</td><td id="item_total" class="cart-totals-item-table-price">' + item_subtotal_formatted + '</td></tr>');

        if (data['confirm_totals_data']['item_discount'] != null && data['confirm_totals_data']['item_discount'] != 0) {
            var item_discount_formatted = '$' + data['confirm_totals_data']['item_discount'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            $('#confirm-total-table').append('<tr><td class="cart-totals-item-table-title">Item Discount</td><td id="item_discount_total" class="cart-totals-item-table-price">(' + item_discount_formatted + ')</td></tr>');
        }

        var shipping_subtotal_formatted = '$' + data['confirm_totals_data']['shipping_subtotal'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
        $('#confirm-total-table').append('<tr><td class="cart-totals-item-table-title">Shipping</td><td id="shipping_method_total" class="cart-totals-item-table-price">' + shipping_subtotal_formatted + '</td></tr>');

        if (data['confirm_totals_data']['shipping_discount'] != null && data['confirm_totals_data']['shipping_discount'] != 0) {
            var shipping_discount_formatted = '$' + data['confirm_totals_data']['shipping_discount'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            $('#confirm-total-table').append('<tr><td class="cart-totals-item-table-title">Shipping Discount</td><td id="shipping_method_discount_total" class="cart-totals-item-table-price">(' + shipping_discount_formatted + ')</td></tr>');
        }

        //console.log(confirm_total_raw)
        confirm_total_raw = data['confirm_totals_data']['cart_total'];
        //console.log(confirm_total_raw)
        //console.log(confirm_total_formatted)
        confirm_total_formatted = '$' + data['confirm_totals_data']['cart_total'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
        //console.log(confirm_total_formatted)
        $('#confirm-total-table').append('<tr><td class="cart-totals-item-table-title"><b>Cart Total</b></td><td id="confirm_total" class="cart-totals-item-table-price"><b>' + confirm_total_formatted + '</b></td></tr>');

        $('#confirm-total-table').append('<tr><td class="cart-totals-item-table-title cart-inventory-note">Note: State and local sales tax is included</td></tr>');

    }

    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/confirm-payment-data',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_confirm_payment_data
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'confirm-payment-data');
            $.display_page_fatal_error('confirm-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });

};

load_confirm_payment_data = function( data, textStatus, xhr ) {
    //console.log(data);
    //console.log('number_of_items_in_order is ' + number_of_items_in_order);


    if (data['customer_data'] != null && Object.keys(data['customer_data']).length !== 0) {
        stripe_payment_token = data['customer_data']['token'];
        stripe_payment_args = data['customer_data']['args'];
        display_payment_data();
        $('#enter-payment-information-button-span').html('CHANGE PAYMENT & SHIPPING INFO');

        $('#login-create-account-continue-anon-subheader').remove();
        $('#login-create-account-continue-anon-wrapper').remove();
        $('#confirm-anonymous-email-address-wrapper').remove();

        $('#enter-payment-information-button-wrapper').removeClass('hide');
        $('#confirm-order-agree-terms-of-sale').removeClass('hide');
        $('#confirm-checkout-button-wrapper-bottom').removeClass('hide');

        $('#confirmation-email-sub-header').removeClass('hide');
        $('#confirmation-email-detail-wrapper').removeClass('hide');
        $('#confirmation-email-detail-wrapper').html('');
        var change_email_address_span;
        if (!$.user_logged_in) {
            change_email_address_span = ' <span id="change-confirmation-email-address" class="confirm-change-confirmation-email-address">[Change Email Address]</span>';
        }
        else {
            change_email_address_span = '';
        }
        $('#confirmation-email-detail-wrapper').append('<div class="account-item"><div class="confirm-detail-line">An order confirmation/receipt will be sent to: ' + stripe_payment_token.email + '.' + change_email_address_span + '</div></div>');
        $('#change-confirmation-email-address').click(function (event)
        {
            //console.log('change-confirmation-email-address clicked');
            change_confirmation_email_address();
        });
    }
    if (data['email'] != null) {
        set_up_stripe_checkout_handler(data['email'], data['stripe_publishable_key']);
    }
    if (stripe_payment_token != null && stripe_payment_token.email != null) {
        set_up_stripe_checkout_handler(stripe_payment_token.email, data['stripe_publishable_key']);
    }
};
set_up_stripe_checkout_handler = function (email, stripe_publishable_key) {
    //console.log(confirm_total_raw)
    //console.log(confirm_total_formatted)

    if (number_of_items_in_order >= 2) {
        var description_str = number_of_items_in_order + ' Items: ' + confirm_total_formatted;
    }
    else {
        var description_str = number_of_items_in_order + ' Item: ' + confirm_total_formatted;
    }
    stripe_checkout_handler = StripeCheckout.configure({
        key: stripe_publishable_key,
        name: 'StartupWebApp.com',
        panelLabel: 'Verify',
        description: description_str,
        zipCode: true,
        email: email,
        locale: 'auto',
        billingAddress: true,
        shippingAddress: true,
        amount: confirm_total_raw * 100,
        token: stripe_checkout_handler_token_callback
    });	 	
};
stripe_checkout_handler_token_callback = function(token, args) {
    //console.log(token);
    //console.log(token.card);
    //console.log('args are...');
    //console.log(args);
    // You can access the token ID with `token.id`.
    // Get the token ID to your server-side code for use.
    stripe_checkout_handler.close();

    confirm_order_payment_shipping_error.attr('class', 'confirm-order-form-error-text-hidden');
    confirm_order_payment_shipping_error.empty();

    stripe_payment_token = token;
    stripe_payment_args = args;
    $('#enter-payment-information-button-span').html('CHANGE PAYMENT & SHIPPING INFO');
    display_payment_data();
    process_stripe_payment_token();
};

change_confirmation_email_address = function () {
    //console.log('in change_confirmation_email_address');
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/change-confirmation-email-address',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: change_confirmation_email_address_callback
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'change-confirmation-email-address');
            $.display_page_fatal_error('confirm-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while processing your request. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });
};
change_confirmation_email_address_callback = function () {
    //console.log('in change_confirmation_email_address_callback');
    location.reload();
};

display_payment_data = function() {
    $('#shipping-address-sub-header').removeClass('hide');
    $('#shipping-address-detail-wrapper').removeClass('hide');
    $('#shipping-address-details').html('');
    $('#shipping-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.shipping_name + '</div>');
    $('#shipping-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.shipping_address_line1 + '</div>');
    if (typeof stripe_payment_args.shipping_address_state == 'undefined') {
        stripe_payment_args.shipping_address_state = '';
    }
    $('#shipping-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.shipping_address_city + ', ' + stripe_payment_args.shipping_address_state + ' ' + stripe_payment_args.shipping_address_zip + '</div>');
    $('#shipping-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.shipping_address_country + '</div>');

    $('#billing-address-sub-header').removeClass('hide');
    $('#billing-address-detail-wrapper').removeClass('hide');
    $('#billing-address-details').html('');
    $('#billing-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.billing_name + '</div>');
    $('#billing-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.billing_address_line1 + '</div>');
    if (typeof stripe_payment_args.billing_address_state == 'undefined') {
        stripe_payment_args.billing_address_state = '';
    }
    $('#billing-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.billing_address_city + ', ' + stripe_payment_args.billing_address_state + ' ' + stripe_payment_args.billing_address_zip + '</div>');
    $('#billing-address-details').append('<div class="confirm-detail-line">' + stripe_payment_args.billing_address_country + '</div>');

    $('#payment-information-sub-header').removeClass('hide');
    $('#payment-information-detail-wrapper').removeClass('hide');
    $('#payment-information-detail-wrapper').html('');
    $('#payment-information-detail-wrapper').append('<div class="account-item"><div class="confirm-detail-line">' + stripe_payment_token.card.brand + ': **** **** **** ' + stripe_payment_token.card.last4 + ', Exp: ' + stripe_payment_token.card.exp_month + '/' + stripe_payment_token.card.exp_year + '</div></div>');

    $('#confirmation-email-sub-header').removeClass('hide');
    $('#confirmation-email-detail-wrapper').removeClass('hide');
    $('#confirmation-email-detail-wrapper').html('');
    var change_email_address_span;
    if (!$.user_logged_in) {
        change_email_address_span = ' <span id="change-confirmation-email-address" class="confirm-change-confirmation-email-address">[Change Email Address]</span>';
    }
    else {
        change_email_address_span = '';
    }
    $('#confirmation-email-detail-wrapper').append('<div class="account-item"><div class="confirm-detail-line">An order confirmation/receipt will be sent to: ' + stripe_payment_token.email + '.' + change_email_address_span + '</div></div>');
    $('#change-confirmation-email-address').click(function (event)
    {
        //console.log('change-confirmation-email-address clicked');
        change_confirmation_email_address();
    });
};
 
process_stripe_payment_token = function() {
    //console.log('stripe_payment_args are...');
    //console.log(stripe_payment_args);
    var json_data = {'stripe_token':stripe_payment_token.id, 'email':stripe_payment_token.email, 'stripe_payment_args':JSON.stringify(stripe_payment_args)};

    //console.log('json_data is ...');
    //console.log(json_data);

    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/order/process-stripe-payment-token',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: process_stripe_payment_token_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
	    }
    })
        .fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'order-process-stripe-payment-token');
            switch (xhr.status) {
	        case 403:
	           // handle unauthorized
                if (token_retried == false) {
                    //console.log('retrying token');
                    token_retried = true;
                    $.get_token(process_stripe_payment_token);
                }
                else {
		        	$.display_page_fatal_error('confirm-detail-body');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('confirm-detail-body');
	           	break;
	    }	        
        });	
};
process_stripe_payment_token_callback = function( data, textStatus, xhr ) {
    //console.log(data);

 	if (data['process_stripe_payment_token'] == 'success') {
        //console.log('process_stripe_payment_token successful');
        check_if_checkout_ready();
    }
    else {
        //console.log('process_stripe_payment_token_callback error');
        var errors = [];
        if (data['errors']['error'] == 'stripe-token-required') {
            errors.push({'type': 'stripe-token-required','description': 'An error occurred while processing your payment.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-stripe-token-required');
        }
        else if (data['errors']['error'] == 'error-creating-stripe-customer') {
            errors.push({'type': 'error-creating-stripe-customer','description': 'An error occurred while processing your payment.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-error-creating-stripe-customer');
        }
        else {
            errors.push({'type': 'confirm-undefined','description': 'There was an undefined error processing your request.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-error-creating-stripe-customer-undefined');
        }
    }
};

set_up_confirm_form_listeners = function() {
    //console.log('set_up_confirm_form_listeners called');

    $('#enter-payment-information-button').click(function(e){
        //console.log('enter-payment-information-button clicked');
        stripe_checkout_handler.open({
        });
  	});
	
    $('#confirm-order-terms-of-sale-agree').change(function(e){
        //console.log('confirm-order-terms-of-sale-agree changed');
        confirm_order_terms_of_sale_agree_changed();
    });

    $('#confirm-anonymouns-button').click(function(e){
        //console.log('confirm-anonymouns-button clicked');
        $('#confirm-anonymous-email-address-wrapper').removeClass('hide');
        $('#confirm-anonymous-email-address').focus();
    });

    $.set_place_holder_listeners(anonymous_email_address_field, 'Email Address *');

    $.bind_key_to_form_submit_button(anonymous_email_address_field, 'enterKey', $('#continue-anonymouns-email-button'), 13);

    $('#continue-anonymouns-email-button').click(function (event)
    {
        //console.log('continue button clicked');
        look_up_anonymous_email_address();
    });
};

look_up_anonymous_email_address = function() {
    anonymous_email_address_field.attr('class', 'confirm-anonymous-email-address-text-box');
    anonymous_email_address_error.attr('class', 'login-form-error-text-hidden');
    anonymous_email_address_error.empty();

    var anonymous_email_address_val = anonymous_email_address_field.val();

    var anonymous_email_address_valid = $.isEmailValid(anonymous_email_address_val, 254);
    $.display_errors(anonymous_email_address_valid, anonymous_email_address_error, anonymous_email_address_field, 'anonymous_email_address', false, 'confirm-anonymous-email-address-text-box-error', 'confirm-anonymous-email-address-form-error-text');

    if (anonymous_email_address_valid.length == 0) {
	    $('#continue-anonymouns-email-button').remove();
	    $('#login-create-account-continue-anon-button-wrapper').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');

        var json_data = {'anonymous_email_address':anonymous_email_address_val
        };

        //console.log(json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/order/anonymous-email-address-payment-lookup',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
    		success: look_up_anonymous_email_address_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    }
        })
            .fail(function(xhr, textStatus, errorThrown) {
		    //console.log('post update-my-information failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'anonymous-email-address-payment-lookup');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(update_my_information);
                    }
                    else {
			        	$.display_page_fatal_error('confirm-detail-body');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('confirm-detail-body');
		           	break;
		    }	        
            });
    }

};

look_up_anonymous_email_address_callback = function( data, textStatus, xhr ) {
	
    //console.log(data);
    if (data['anonymous_email_address_payment_lookup'] == 'success') {
        //console.log('anonymous_email_address_payment_lookup success');

        if (data['customer_data'] != null) {
            stripe_payment_token = data['customer_data']['token'];
            stripe_payment_args = data['customer_data']['args'];
            display_payment_data();
            $('#enter-payment-information-button-span').html('CHANGE PAYMENT & SHIPPING INFO');
        }
        set_up_stripe_checkout_handler(anonymous_email_address_field.val(), data['stripe_publishable_key']);

        $('#login-create-account-continue-anon-subheader').remove();
        $('#login-create-account-continue-anon-wrapper').remove();
        $('#confirm-anonymous-email-address-wrapper').remove();

        $('#enter-payment-information-button-wrapper').removeClass('hide');
        $('#confirm-order-agree-terms-of-sale').removeClass('hide');
        $('#confirm-checkout-button-wrapper-bottom').removeClass('hide');

        $('#confirmation-email-sub-header').removeClass('hide');
        $('#confirmation-email-detail-wrapper').removeClass('hide');
        $('#confirmation-email-detail-wrapper').html('');
        var change_email_address_span;
        if (!$.user_logged_in) {
            change_email_address_span = ' <span id="change-confirmation-email-address" class="confirm-change-confirmation-email-address">[Change Email Address]</span>';
        }
        else {
            change_email_address_span = '';
        }
        $('#confirmation-email-detail-wrapper').append('<div class="account-item"><div class="confirm-detail-line">An order confirmation/receipt will be sent to: ' + anonymous_email_address_field.val() + '.' + change_email_address_span + '</div></div>');
        $('#change-confirmation-email-address').click(function (event)
        {
            //console.log('change-confirmation-email-address clicked');
            change_confirmation_email_address();
        });
    }
    else {
        //console.log('look_up_anonymous_email_address_callback error');
	    $('.create-account-loader-wrapper').remove();
	    $('#login-create-account-continue-anon-button-wrapper').append('<div id="continue-anonymouns-email-button" class="confirm-anonymous-email-address-continue-button"><span class="confirm-login-button-span">CONTINUE</span></div>');

        $('#continue-anonymouns-email-button').click(function (event)
        {
            //console.log('continue button clicked');
            look_up_anonymous_email_address();
        });

        $.bind_key_to_form_submit_button(anonymous_email_address_field, 'enterKey', $('#edit-my-information-go'), 13);

        var errors = [];
        if (data['errors']['error'] == 'email-address-is-associated-with-member') {
            errors.push({'type': 'email-address-is-associated-with-member','description': data['errors']['description']});
            $.display_errors(errors, anonymous_email_address_error, anonymous_email_address_field, 'anonymous_email_address-', false, 'confirm-anonymous-email-address-text-box-error', 'confirm-anonymous-email-address-form-error-text');
            $.log_client_event('ajaxerror', 'anonymous-email-address-lookup-email-address-is-associated-with-member');
        }
        else if (data['errors']['error'] == 'error-looking-up-payment-data') {
            errors.push({'type': 'error-looking-up-payment-data','description': data['errors']['description']});
            $.display_errors(errors, anonymous_email_address_error, anonymous_email_address_field, 'anonymous_email_address-', false, 'confirm-anonymous-email-address-text-box-error', 'confirm-anonymous-email-address-form-error-text');
            $.log_client_event('ajaxerror', 'anonymous-email-address-lookup-error-looking-up-payment-data');
        }
        else if (data['errors']['error'] == 'anonymous-email-address-required') {
            errors.push({'type': 'anonymous-email-address-required','description': data['errors']['description']});
            $.display_errors(errors, anonymous_email_address_error, anonymous_email_address_field, 'anonymous_email_address-', false, 'confirm-anonymous-email-address-text-box-error', 'confirm-anonymous-email-address-form-error-text');
            $.log_client_event('ajaxerror', 'anonymous-email-address-lookup-anonymous-email-address-required');
        }
        else {
            errors.push({'type': 'anonymous-email-address-lookup-undefined','description': 'There was an undefined error processing your request.'});
            $.display_errors(errors, anonymous_email_address_error, anonymous_email_address_field, 'anonymous_email_address-', false, 'confirm-anonymous-email-address-text-box-error', 'confirm-anonymous-email-address-form-error-text');
            $.log_client_event('ajaxerror', 'anonymous-email-address-lookup-undefined');
        }

    }
};

confirm_order_terms_of_sale_agree_changed = function(){
    //console.log('confirm_order_terms_of_sale_agree_changed called');	
    check_if_checkout_ready();
};

check_if_checkout_ready = function () {
    if (confirm_order_terms_of_sale_agree_field.is(':checked')) {
        if (stripe_payment_token != null) {
            $('#place-order-button-bottom').click(function(e){
                //console.log('place-order-button-bottom clicked');
                confirm_place_order(e);
            });
            $('#place-order-button-span').removeClass('confirm-order-button-disabled-span');
        }
        else {
            $('#place-order-button-bottom').unbind('click');
            $('#place-order-button-span').addClass('confirm-order-button-disabled-span');			
        }
    }
    else {
        $('#place-order-button-bottom').unbind('click');
        $('#place-order-button-span').addClass('confirm-order-button-disabled-span');
    }	
};

confirm_place_order = function(event) {

    confirm_order_terms_of_sale_agree_field.attr('class', 'confirm-order-agree-terms-of-sale-checkbox');
    confirm_order_terms_of_sale_agree_error.attr('class', 'confirm-order-form-error-text-hidden');
    confirm_order_terms_of_sale_agree_error.empty();

    var confirm_order_terms_of_sale_agree_val = 'false';
    if (confirm_order_terms_of_sale_agree_field.is(':checked')) {
        confirm_order_terms_of_sale_agree_val = 'true';
    }

    //console.log('newsletter_val is ' + newsletter_val);
    var confirm_order_terms_of_sale_agree_valid = $.isTermsOfUseAgreeValid(confirm_order_terms_of_sale_agree_val);
    $.display_errors(confirm_order_terms_of_sale_agree_valid, confirm_order_terms_of_sale_agree_error, confirm_order_terms_of_sale_agree_field, 'terms_of_sale_agree_', true, null, 'confirm-order-form-error-text');

    var newsletter_val = null;
    var save_defaults_val = null;
    if (!$.user_logged_in) {
        newsletter_val = 'false';
        if ($('#confirm-order-sign-up-for-marketing-emails').is(':checked')) {
            newsletter_val = 'true';
        }
    }
    else {
        save_defaults_val = 'false';
        if ($('#save-shipping-and-payment-info').is(':checked')) {
            save_defaults_val = 'true';
        }
    }

    confirm_order_payment_shipping_error.attr('class', 'confirm-order-form-error-text-hidden');
    confirm_order_payment_shipping_error.empty();
    if (stripe_payment_token == null || stripe_payment_args == null) {
        confirm_order_payment_shipping_error.append('You must enter payment and shipping information prior to completing your order.');
        confirm_order_payment_shipping_error.attr('class', 'confirm-order-form-error-text');
    }

    //console.log(stripe_payment_token);
    //console.log(stripe_payment_args);

    if (confirm_order_terms_of_sale_agree_valid.length == 0 && stripe_payment_token != null && stripe_payment_args != null) {
	    $('#place-order-button-bottom').remove();
	    $('#confirm-checkout-button-wrapper-bottom').append('<div class="create-account-loader-wrapper"><div class="create-account-loader"></div></div>');



	    var stripe_payment_info = {'email':stripe_payment_token.email,
	    						   'payment_type':stripe_payment_token.type,
	    						   'card_name':stripe_payment_token.card.name,
	    						   'card_brand':stripe_payment_token.card.brand,
	    						   'card_last4':stripe_payment_token.card.last4,
	    						   'card_exp_month':stripe_payment_token.card.exp_month,
	    						   'card_exp_year':stripe_payment_token.card.exp_year,
	    						   'card_zip':stripe_payment_token.card.address_zip,
        };
	    var stripe_shipping_addr = {'name':stripe_payment_args.shipping_name,
            'address_line1':stripe_payment_args.shipping_address_line1,
            'address_city':stripe_payment_args.shipping_address_city,
            'address_state':stripe_payment_args.shipping_address_state,
            'address_zip':stripe_payment_args.shipping_address_zip,
            'address_country':stripe_payment_args.shipping_address_country,
            'address_country_code':stripe_payment_args.shipping_address_country_code,
	    };
	    var stripe_billing_addr = {'name':stripe_payment_args.billing_name,
								   'address_line1':stripe_payment_args.billing_address_line1,
								   'address_city':stripe_payment_args.billing_address_city,
								   'address_state':stripe_payment_args.billing_address_state,
								   'address_zip':stripe_payment_args.billing_address_zip,
								   'address_country':stripe_payment_args.billing_address_country,
								   'address_country_code':stripe_payment_args.billing_address_country_code,
	    };
        var json_data = {'agree_to_terms_of_sale':confirm_order_terms_of_sale_agree_field.is(':checked'),
						 'newsletter':newsletter_val, 
						 'save_defaults':save_defaults_val,
						 'stripe_payment_info':JSON.stringify(stripe_payment_info),
						 'stripe_shipping_addr':JSON.stringify(stripe_shipping_addr),
						 'stripe_billing_addr':JSON.stringify(stripe_billing_addr)
        };

        //console.log('json_data is ' + json_data);

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/order/confirm-place-order',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
            success: confirm_place_order_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    }
        })
            .fail(function(xhr, textStatus, errorThrown) {
		    //console.log('post update-my-information failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'order-place-order');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(confirm_place_order);
                    }
                    else {
			        	$.display_page_fatal_error('confirm-detail-body');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('confirm-detail-body');
		           	break;
		    }	        
            });
    }
};
confirm_place_order_callback = function( data, textStatus, xhr ) {
    //console.log(data);
    //console.log('confirm_update_shipping_method_callback called');

 	if (data['confirm_place_order'] == 'success') {
        //console.log('place order successful');
        //console.log('order_identifier is ' + data['order_identifier']);
        window.location = '/account/order?identifier=' + data['order_identifier'];
    }
    else {

	    $('.create-account-loader-wrapper').remove();
	    $('#confirm-checkout-button-wrapper-bottom').append('<div id="place-order-button-bottom" class="confirm-order-button"><span id="place-order-button-span" class="confirm-order-button-span confirm-order-button-disabled-span">PLACE ORDER</span></div>');
        confirm_order_terms_of_sale_agree_changed();

        //console.log('confirm_place_order_callback error');
        var errors = [];
        if (data['errors']['error'] == 'error-saving-order') {
            errors.push({'type': 'confirm-error-saving-order','description': 'An error occurred while processing your order.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-error-saving-order');
        }
        else if (data['errors']['error'] == 'cart-not-found') {
            errors.push({'type': 'cart-not-found','description': 'No cart was found.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-cart-not-found');
        }
        else if (data['errors']['error'] == 'agree-to-terms-of-sale-must-be-checked') {
            errors.push({'type': 'confirm-agree-to-terms-of-sale--must-be-checked','description': 'You must agree to the StartupWebApp.com <a href="/terms-of-sale" target="_blank">Terms of Sale</a>.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-agree-to-terms-of-sale-must-be-checked');
        }
        else if (data['errors']['error'] == 'agree-to-terms-of-sale-required') {
            errors.push({'type': 'confirm-agree-to-terms-of-sale-required','description': 'You must agree to the StartupWebApp.com <a href="/terms-of-sale" target="_blank">Terms of Sale</a>.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-agree-to-terms-of-sale-required');
        }
        else if (data['errors']['error'] == 'error-saving-payment') {
            errors.push({'type': 'confirm-error-saving-payment','description': 'An error occurred while processing your payment. Please refresh the page and try again.'});
            $.display_errors(errors, $('#confirm-order-payment-shipping-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-error-saving-payment');
        }
        else {
            errors.push({'type': 'confirm-undefined','description': 'There was an undefined error processing your request.'});
            $.display_errors(errors, $('#confirm-order-terms-of-sale-agree-error'), $('#confirm-order-terms-of-sale-agree'), 'place-order-error-', true, null, 'confirm-order-form-error-text');
            $.log_client_event('ajaxerror', 'confirm-undefined');
        }
    }
};

cart_check_for_valid_checkout_conditions = function () {
    //console.log('cart_check_for_valid_checkout_conditions called');
    //console.log('cart_item_count is ' + cart_item_count);
    //console.log('cart_item_quantity is ' + cart_item_quantity);
    //console.log('cart_contains_backordered_out_of_stock_item is ' + cart_contains_backordered_out_of_stock_item);
    if (cart_item_count <= 0 || cart_item_quantity <= 0 || cart_contains_backordered_out_of_stock_item == true) {
        $('#login-create-account-continue-anon-subheader').remove();
        $('#login-create-account-continue-anon-wrapper').remove();
        $('#confirm-checkout-button-wrapper-bottom').remove();
        $('#confirm-checkout-button-wrapper-bottom').addClass('hide');
        if (cart_contains_backordered_out_of_stock_item == true) {
            $('#confirm-detial-general-notification').html('Please remove the Back Ordered or Out of Stock item(s) from your cart to continue with checkout.');
        }
    }
    else {
        $('#confirm-checkout-button-wrapper-bottom').removeClass('hide');
        $('#confirm-detial-general-notification').html('');
    }
};

