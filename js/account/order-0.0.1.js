// GET Parameters
var order_identifier = null;

// other global variables 
var env_vars = $.env_vars();

$(document).ready(function() {
    order_identifier = $.urlParam('identifier');
    if (order_identifier == null) {
        $.load_error('order_identifier_is_null');
    }
    else {
        console.log('order_identifier is ' + order_identifier);
        var url_str = env_vars['api_url'] + '/order/' + order_identifier;
        $.ajax({method: 'GET', url: url_str, dataType: 'json', xhrFields: {withCredentials: true}, success: load_order}).fail(function(){ajax_error(order_identifier);$.load_error('error_looking_up_order');;});
    }
});

load_order = function( data, textStatus, xhr ) {
    if (!$.user_logged_in) {
        $('#back-wrapper-top').remove();
        $('#back-wrapper-bottom').remove();
    }	

    console.log(data);
    if (data['order_detail'] == 'error') {
        if (data['errors']['error'] == 'log-in-required-to-view-order') {
            var order_identifier_str = '&order_identifier=' + order_identifier;
            window.location = '/login?next=account/order' + order_identifier_str;
        }
        else if (data['errors']['error'] == 'order-not-in-account') {
            $('#order-wrapper').removeClass('hide');
            $('#order-detial-general-notification').append('The order identifier provided is not associated with your account.');
        }
        else if (data['errors']['error'] == 'order-not-found') {
            $('#order-wrapper').removeClass('hide');
            $('#order-detial-general-notification').append('The order identifier provided was not found.');
        }
    }
    else {
        $('#order-information').append('<div class="account-item"><span class="account-my-information-label">Order Identifier</span>: <span class="account-my-information-value">' + data['order_data']['order_attributes']['identifier'] + '</span></div>');

        $('#order-wrapper').removeClass('hide');
        $('#order-information-sub-header').removeClass('hide');
        $('#order-status-sub-header').removeClass('hide');
        $('#item-information-sub-header').removeClass('hide');
        $('#item-information-detail-wrapper').removeClass('hide');
        $('#shipping-cost-sub-header').removeClass('hide');
        $('#discount-codes-sub-header').removeClass('hide');
        $('#discount-code-detail-wrapper').removeClass('hide');
        $('#order-total-sub-header').removeClass('hide');
        $('#shipping-address-sub-header').removeClass('hide');
        $('#billing-address-sub-header').removeClass('hide');
        $('#payment-information-sub-header').removeClass('hide');
        $('#confirmation-email-sub-header').removeClass('hide');
        $('#confirm-order-agree-terms-of-sale-wrapper').removeClass('hide');

        for (var status in data['order_data']['order_statuses']) {
            var title = data['order_data']['order_statuses'][status]['title'];
            var description = data['order_data']['order_statuses'][status]['description'];
            var created_date_time = new Date(data['order_data']['order_statuses'][status]['created_date_time']);
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            var created_date_time_formatted = created_date_time.toLocaleTimeString('en-US',options);
            $('#order-status').append('<div class="account-item"><span class="account-my-information-value">' + created_date_time_formatted + ': ' + title + '. ' + description + '</span></div>');
        }


        for (var product_sku in data['order_data']['order_items']['product_sku_data']) {
            var color = data['order_data']['order_items']['product_sku_data'][product_sku]['color'];
            var description = data['order_data']['order_items']['product_sku_data'][product_sku]['description'];
            var parent_product__title = data['order_data']['order_items']['product_sku_data'][product_sku]['parent_product__title'];
            var parent_product__title_url = data['order_data']['order_items']['product_sku_data'][product_sku]['parent_product__title_url'];
            var parent_product__identifier = data['order_data']['order_items']['product_sku_data'][product_sku]['parent_product__identifier'];
            var price = parseFloat(data['order_data']['order_items']['product_sku_data'][product_sku]['price']);
            var quantity = data['order_data']['order_items']['product_sku_data'][product_sku]['quantity'];
            var size = data['order_data']['order_items']['product_sku_data'][product_sku]['size'];
            var sku_id = data['order_data']['order_items']['product_sku_data'][product_sku]['sku_id'];
            var sku_image_url = data['order_data']['order_items']['product_sku_data'][product_sku]['sku_image_url'];

            var item_image_str = '<img alt="' + parent_product__title + '" class="cart-detail-item-image" src="' + sku_image_url + '"></img>';
            var item_price_each_formatted = '$' + price.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            var item_subtotal = price * quantity;
            var item_subtotal_formatted = '$' + item_subtotal.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            var item_image_str = '<a href="/product?name=' + parent_product__title_url + '&id=' + parent_product__identifier + '&referrer=order&order_identifier=' + order_identifier + '"><img alt="' + parent_product__title + '" class="cart-details-item-image" src="' + sku_image_url + '"></img></a>';

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
            var title_full_link_str = '<a href="/product?name=' + parent_product__title + '&id=' + parent_product__identifier + '&referrer=order&order_identifier=' + order_identifier + '">' + sku_title_str + '</a>';
            $('#sku-table').append('<tr id="sku_row_' + sku_id + '"><td class="cart-details-item-table-image">' + item_image_str + '</td><td class="cart-details-item-table-title">' + title_full_link_str + '</td><td id="sku_price_' + sku_id + '" class="cart-details-item-table-price" sku_price="' + price + '">' + item_price_each_formatted + '</td><td class="cart-details-item-table-quantity">' + quantity + '</div></td><td id="sku_subtotal_' + sku_id + '" class="cart-details-item-table-price">' + item_subtotal_formatted + '</td></tr>');
        }

        var carrier = data['order_data']['order_shipping_method']['carrier'];
        var shipping_cost = parseFloat(data['order_data']['order_shipping_method']['shipping_cost']);
        var shipping_cost_formatted = '$' + shipping_cost.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
        var shipping_method_str = '<div class="cart-shipping-method-option">' + carrier + '&nbsp;' + shipping_cost_formatted + '</div>';
        $('#shipping-methods').append(shipping_method_str);

        $('#discount-code-table').find('tr:gt(0)').remove();

        for (var discount_code in data['order_data']['order_discount_codes']) {
            var code = data['order_data']['order_discount_codes'][discount_code]['code'];
            var combinable = data['order_data']['order_discount_codes'][discount_code]['combinable'];
            var description = data['order_data']['order_discount_codes'][discount_code]['description'];
            var discount_amount = data['order_data']['order_discount_codes'][discount_code]['discount_amount'];
            var discount_code_id = data['order_data']['order_discount_codes'][discount_code]['discount_code_id'];
            var discount_applied = data['order_data']['order_discount_codes'][discount_code]['discount_applied'];

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
            $('#discount-code-table').addClass('hide');
        }

        $('#order-total-table').find('tr').remove();

        var item_subtotal_formatted = '$' + parseFloat(data['order_data']['order_totals']['item_subtotal']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        $('#order-total-table').append('<tr><td class="cart-totals-item-table-title">Item Subtotal</td><td id="item_total" class="cart-totals-item-table-price">' + item_subtotal_formatted + '</td></tr>');

        if (data['order_data']['order_totals']['item_discount'] != null && data['order_data']['order_totals']['item_discount'] != 0) {
            var item_discount_formatted = '$' + parseFloat(data['order_data']['order_totals']['item_discount']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
            $('#order-total-table').append('<tr><td class="cart-totals-item-table-title">Item Discount</td><td id="item_discount_total" class="cart-totals-item-table-price">(' + item_discount_formatted + ')</td></tr>');
        }

        var shipping_subtotal_formatted = '$' + parseFloat(data['order_data']['order_totals']['shipping_subtotal']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        $('#order-total-table').append('<tr><td class="cart-totals-item-table-title">Shipping</td><td id="shipping_method_total" class="cart-totals-item-table-price">' + shipping_subtotal_formatted + '</td></tr>');

        if (data['order_data']['order_totals']['shipping_discount'] != null && data['order_data']['order_totals']['shipping_discount'] != 0) {
            var shipping_discount_formatted = '$' + parseFloat(data['order_data']['order_totals']['shipping_discount']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
            $('#order-total-table').append('<tr><td class="cart-totals-item-table-table-title">Shipping Discount</td><td id="shipping_method_discount_total" class="cart-totals-item-table-price">(' + shipping_discount_formatted + ')</td></tr>');
        }

        var order_total_formatted = '$' + parseFloat(data['order_data']['order_totals']['order_total']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        $('#order-total-table').append('<tr><td class="cart-totals-item-table-title"><b>Cart Total</b></td><td id="order_total" class="cart-totals-item-table-price"><b>' + order_total_formatted + '</b></td></tr>');

        $('#order-total-table').append('<tr><td class="cart-totals-item-table-title cart-inventory-note">Note: State and local sales tax is included</td></tr>');

        if (Object.keys(data['order_data']['order_shipping_address']).length === 0) {		
            $('#shipping-address-details').append('<div class="account-item">This order has no shipping address</div>');
        }
        else {
            $('#shipping-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_shipping_address']['name'] + '</div>');
            $('#shipping-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_shipping_address']['address_line1'] + '</div>');
            $('#shipping-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_shipping_address']['city'] + ', ' + data['order_data']['order_shipping_address']['state'] + ' ' + data['order_data']['order_shipping_address']['zip'] + '</div>');
            $('#shipping-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_shipping_address']['country'] + '</div>');			
        }

        if (Object.keys(data['order_data']['order_billing_address']).length === 0) {		
            $('#billing-address-details').append('<div class="account-item">This order has no billing address</div>');
        }
        else {
            $('#billing-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_billing_address']['name'] + '</div>');
            $('#billing-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_billing_address']['address_line1'] + '</div>');
            $('#billing-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_billing_address']['city'] + ', ' + data['order_data']['order_billing_address']['state'] + ' ' + data['order_data']['order_billing_address']['zip'] + '</div>');
            $('#billing-address-details').append('<div class="confirm-detail-line">' + data['order_data']['order_billing_address']['country'] + '</div>');
        }

        if (Object.keys(data['order_data']['order_payment_info']).length === 0) {
            $('#payment-information-detail-wrapper').append('<div class="account-item">This order has no payment information</div>');
        }
        else {
            // Check if card details are available (old flow) or null (new Stripe Checkout Sessions)
            var payment_info = data['order_data']['order_payment_info'];
            if (payment_info['card_brand'] && payment_info['card_last4']) {
                // Old flow: Full card details available
                $('#payment-information-detail-wrapper').append('<div class="account-item"><div class="confirm-detail-line">' + payment_info['card_brand'] + ': **** **** **** ' + payment_info['card_last4'] + ', Exp: ' + payment_info['card_exp_month'] + '/' + payment_info['card_exp_year'] + '</div></div>');
            }
            else {
                // New Checkout Sessions flow: Card details not available
                var payment_method_display = payment_info['payment_type'] || 'Card';
                payment_method_display = payment_method_display.charAt(0).toUpperCase() + payment_method_display.slice(1);
                $('#payment-information-detail-wrapper').append('<div class="account-item"><div class="confirm-detail-line">Payment Method: ' + payment_method_display + ' (processed by Stripe)</div></div>');
            }
        }

        if (Object.keys(data['order_data']['order_payment_info']).length === 0) {		
            $('#confirmation-email-detail-wrapper').append('<div class="account-item">This order has no confirmation email</div>');
        }
        else {
            $('#confirmation-email-detail-wrapper').append('<div class="account-item"><div class="confirm-detail-line">An order confirmation/receipt was sent to: ' + data['order_data']['order_payment_info']['email'] + '.</div></div>');
        }
    }
};

ajax_error = function(type) {
    $.log_client_event('ajaxerror', 'order-' + type);
};
