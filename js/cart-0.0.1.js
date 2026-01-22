// other global variables
var env_vars = $.env_vars();
var token_retried = false;
var cart_item_count = 0;
var cart_contains_backordered_out_of_stock_item = false;
var cart_item_quantity = 0;

$(document).ready(function() {
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/cart-items',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_cart_items
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'cart-items');
            $.display_page_fatal_error('cart-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });

    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/cart-shipping-methods',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_shipping_methods
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'cart-shipping-methods');
            $.display_page_fatal_error('cart-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });

    set_up_cart_form_listeners();
});

load_cart_items = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['cart_found'] == true) {
        $('#cart-detail-body').removeClass('hide');
		
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

            // Check if discount pricing data is available
            var discount_applied = data['item_data']['product_sku_data'][product_sku]['discount_applied'] || false;
            var original_price_cents = data['item_data']['product_sku_data'][product_sku]['original_price_cents'];
            var discounted_price_cents = data['item_data']['product_sku_data'][product_sku]['discounted_price_cents'];

            var item_price_each_formatted;
            var item_subtotal;
            if (discount_applied && original_price_cents && discounted_price_cents) {
                // Show discounted price with strikethrough on original
                var original_price = original_price_cents / 100;
                var discounted_price = discounted_price_cents / 100;
                var original_formatted = '$' + original_price.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
                var discounted_formatted = '$' + discounted_price.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
                item_price_each_formatted = '<del>' + original_formatted + '</del> ' + discounted_formatted;
                item_subtotal = discounted_price * quantity;
            } else {
                // No discount - show regular price
                item_price_each_formatted = '$' + parseFloat(price).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
                item_subtotal = parseFloat(price) * quantity;
            }
            var item_subtotal_formatted = '$' + item_subtotal.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
            var item_image_str = '<a href="/product?name=' + parent_product__title_url + '&id=' + parent_product__identifier + '&referrer=cart"><img alt="' + parent_product__title + '" class="cart-details-item-image" src="' + sku_image_url + '"></img></a>';

            var sku_qty_box = '<input type="text" id="sku_qty_' + sku_id + '" sku_id="' + sku_id + '" class="cart-qty-text-box" maxlength="2" value="' + quantity + '">';

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
            var title_full_link_str = '<a href="/product?name=' + parent_product__title + '&id=' + parent_product__identifier + '&referrer=cart">' + sku_title_str + '</a>';
            $('#sku-table').append('<tr id="sku_row_' + sku_id + '"><td class="cart-details-item-table-image">' + item_image_str + '</td><td class="cart-details-item-table-title">' + title_full_link_str + '&nbsp;<span class="cart-inventory-note" sku_inventory_status="' + sku_inventory__identifier + '">[' + sku_inventory__title + ']</span>' + '</td><td id="sku_price_' + sku_id + '" class="cart-details-item-table-price" sku_price="' + price + '">' + item_price_each_formatted + '</td><td class="cart-details-item-table-quantity">' + sku_qty_box + '<div id="sku_quantity_error_' + sku_id + '" class="login-form-error-text-hidden"></div></td><td id="sku_subtotal_' + sku_id + '" class="cart-details-item-table-price">' + item_subtotal_formatted + '</td><td class="cart-details-item-table-remove"><span id="sku_remove_short_' + sku_id + '" sku_id="' + sku_id + '" class="cart-sku-remove-link cart-sku-remove-link-short">X</span><span id="sku_remove_full_' + sku_id + '" sku_id="' + sku_id + '" class="cart-sku-remove-link cart-sku-remove-link-full">REMOVE</span></td></tr>');

            $('#sku_qty_' + sku_id).on('input',function(e){
                update_sku_quantity(e);
            });
            $('#sku_remove_short_' + sku_id).click(function(e){
                cart_remove_sku(e);
            });
            $('#sku_remove_full_' + sku_id).click(function(e){
                cart_remove_sku(e);
            });

            cart_item_count += 1;
            cart_item_quantity += quantity;
            if (sku_inventory__identifier != 'in-stock') {
                cart_contains_backordered_out_of_stock_item = true;
            }
        }
	
        $.get_token();
        cart_check_for_valid_checkout_conditions();
    }
    else {
        //console.log('show cart empty');
        show_empty_cart();
    }
};

load_shipping_methods  = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['cart_found'] == true) {
        load_shipping_methods_details(data['cart_shipping_methods'], data['shipping_method_selected']);
        $( '#shipping-methods' ).change(cart_update_shipping_method);
    }

    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/cart-totals',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_cart_totals
    })
        .fail(function() {
	    //console.log('get account_content failed');
            $.log_client_event('ajaxerror', 'cart-totals');
            $.display_page_fatal_error('cart-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });
};
load_shipping_methods_details = function(shipping_method_dict, shipping_method_selected) {
    for (var shipping_method in shipping_method_dict) {
        var identifier = shipping_method_dict[shipping_method]['identifier'];
        var carrier = shipping_method_dict[shipping_method]['carrier'];
        var shipping_cost = shipping_method_dict[shipping_method]['shipping_cost'];
        var shipping_cost_formatted = '$' + parseFloat(shipping_cost).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        if (shipping_method_selected == identifier) {
            var selected_str = ' checked="checked"';
        }
        else {
            var selected_str = '';
        }
        var shipping_radio_option = '<div class="cart-shipping-method-option"><input type="radio" id="shipping_method_' + identifier + '" name="shipping_option" value="' + identifier + '"' + selected_str + '/>&nbsp;' + carrier + '&nbsp;' + shipping_cost_formatted + '</div>';
        $('#shipping-methods').append(shipping_radio_option);
    }

};

// Helper function to reload cart totals via AJAX
var reload_cart_totals = function() {
    $.ajax({
        method: 'GET',
        url: env_vars['api_url'] + '/order/cart-totals',
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: load_cart_totals
    })
        .fail(function() {
            $.log_client_event('ajaxerror', 'cart-totals-reload');
            $.display_page_fatal_error('cart-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
        });
};

load_cart_totals = function( data, textStatus, xhr ) {
    //console.log(data);

    if (data['cart_found'] == true) {
        $('#cart-total-table').find('tr').remove();

        var item_subtotal_formatted = '$' + parseFloat(data['cart_totals_data']['item_subtotal']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        $('#cart-total-table').append('<tr><td class="cart-totals-item-table-title">Item Subtotal</td><td id="item_total" class="cart-totals-item-table-price">' + item_subtotal_formatted + '</td></tr>');

        var shipping_subtotal_formatted = '$' + parseFloat(data['cart_totals_data']['shipping_subtotal']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        $('#cart-total-table').append('<tr><td class="cart-totals-item-table-title">Shipping</td><td id="shipping_method_total" class="cart-totals-item-table-price">' + shipping_subtotal_formatted + '</td></tr>');

        var cart_total_formatted = '$' + parseFloat(data['cart_totals_data']['cart_total']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        $('#cart-total-table').append('<tr><td class="cart-totals-item-table-title"><b>Cart Total</b></td><td id="cart_total" class="cart-totals-item-table-price"><b>' + cart_total_formatted + '</b></td></tr>');

        $('#cart-total-table').append('<tr><td class="cart-totals-item-table-title cart-inventory-note">Note: State and local sales tax is included</td></tr>');

    }
};

set_up_cart_form_listeners = function() {
    //console.log('set_up_cart_form_listeners called');
};

update_sku_quantity = function(event) {
    var sku_id = $(event.target).attr('sku_id');
    $(event.target).attr('class', 'cart-qty-text-box');
    $('#sku_quantity_error_' + sku_id).attr('class', 'login-form-error-text-hidden');
    $('#sku_quantity_error_' + sku_id).empty();

    var sku_qty_new = $(event.target).val();
    if ($(event.target).val() == '') {
        sku_qty_new = 0;
    }
    var sku_quantity_valid = $.isQuantityValid(sku_qty_new, 2);
    $.display_errors(sku_quantity_valid, $('#sku_quantity_error_' + sku_id), $(event.target), 'sku_quantity_error_' + sku_id, false, 'cart-qty-text-box-error');

    if (sku_quantity_valid.length == 0) {
        var json_data = {'sku_id':sku_id,
						 'quantity':sku_qty_new
        };

        $.ajax({
            method: 'POST',
            url: env_vars['api_url'] + '/order/cart-update-sku-quantity',
            dataType: 'json',
		    xhrFields: {
		        withCredentials: true
		    },
		    data: json_data,
            success: cart_update_sku_quantity_callback,
            beforeSend: function(request) {
			    //console.log('in beforeSend');
			    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
		    }
        })
            .fail(function(xhr, textStatus, errorThrown) {
		    //console.log('post update-my-information failed');
	        //console.log('xhr.status is ' + xhr.status);
                $.log_client_event('ajaxerror', 'cart-update-sku-quantity');
                switch (xhr.status) {
		        case 403:
		           // handle unauthorized
                    if (token_retried == false) {
                        //console.log('retrying token');
                        token_retried = true;
                        $.get_token(update_sku_quantity);
                    }
                    else {
			        	$.display_page_fatal_error('cart-detail-body');
			           	break;
			    	}
		        	break;
		        default:
		        	$.display_page_fatal_error('cart-detail-body');
		           	break;
		    }	        
            });
    }
};

cart_update_sku_quantity_callback = function( data, textStatus, xhr ) {
    //console.log(data);
    //console.log('cart_update_sku_quantity_callback called');
    if (data['cart_update_sku_quantity'] == 'success') {
        var sku_subtotal_formatted = '$' + parseFloat(data['sku_subtotal']).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        $('#sku_subtotal_' + data['sku_id']).html(sku_subtotal_formatted);
        reload_cart_totals(); // Reload totals with fresh data

        update_cart_item_quantity();
        cart_check_for_valid_checkout_conditions();
    }
    else {
        //console.log('cart_update_sku_quantity_callback error');
        var errors = [];
        if (data['errors']['error'] == 'cart-sku-not-found') {
            //console.log('cart-sku-not-found');
            errors.push({'type': 'cart-discount-code-not-found','description': 'This sku was not found.'});
            $.log_client_event('ajaxerror', 'cart-update-sku-quantity-sku-not-found');
        }
        else if (data['errors']['error'] == 'sku-id-required') {
            $.log_client_event('ajaxerror', 'cart-update-sku-quantity-sku-id-required');
        }
        else if (data['errors']['error'] == 'cart-not-found') {
            $.log_client_event('ajaxerror', 'cart-update-sku-quantity-cart-not-found');
        }
    }
};
	
cart_remove_sku = function(event) {
    var sku_id = $(event.target).attr('sku_id');
    //console.log('sku_id is ' + sku_id);
    var json_data = {'sku_id':sku_id,
					 'quantity':2
    };

    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/order/cart-remove-sku',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: cart_remove_sku_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
	    }
    })
        .fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'cart-remove-sku');
            switch (xhr.status) {
	        case 403:
	           // handle unauthorized
                if (token_retried == false) {
                    //console.log('retrying token');
                    token_retried = true;
                    $.get_token(update_sku_quantity);
                }
                else {
		        	$.display_page_fatal_error('cart-detail-body');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('cart-detail-body');
	           	break;
	    }	        
        });
};
cart_remove_sku_callback = function( data, textStatus, xhr ) {
    //console.log(data);
    //console.log('cart_remove_sku_callback called');
    if (data['cart_remove_sku'] == 'success') {
        $('#sku_row_' + data['sku_id']).remove();

        if (Object.keys(data['cart_shipping_methods']).length >= 1) {
            $('#shipping-methods').html('');
            load_shipping_methods_details(data['cart_shipping_methods'], data['shipping_method_selected']);
            $( '#shipping-methods' ).unbind('change');
            $( '#shipping-methods' ).change(cart_update_shipping_method);
        }

        load_cart_totals(data, textStatus, xhr);
        $.set_cart_item_counter(data['cart_item_count']);
        cart_item_count -= 1;
        update_cart_contains_backordered_out_of_stock_item();
        cart_check_for_valid_checkout_conditions();
    }
    else {
        //console.log('cart_remove_sku_callback error');
        if (data['errors']['error'] == 'cart-sku-not-found') {
            $.log_client_event('ajaxerror', 'cart-remove-sku-sku-not-found');
        }
        else if (data['errors']['error'] == 'sku-id-required') {
            $.log_client_event('ajaxerror', 'cart-remove-sku-sku-id-required');
        }
        else if (data['errors']['error'] == 'cart-not-found') {
            $.log_client_event('ajaxerror', 'cart-remove-sku-cart-not-found');
        }
    }
};

cart_update_shipping_method = function(event) {

    $(event.target).attr('class', '');
    $('#shipping-method-error').attr('class', 'login-form-error-text-hidden');
    $('#shipping-method-error').empty();

    var shipping_method_identifier = $(event.target).val();
    //console.log('shipping_method_identifier is ' + shipping_method_identifier);
    var json_data = {'shipping_method_identifier':shipping_method_identifier};

    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/order/cart-update-shipping-method',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: cart_update_shipping_method_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
	    }
    })
        .fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'cart-udpate-shipping-method');
            switch (xhr.status) {
	        case 403:
	           // handle unauthorized
                if (token_retried == false) {
                    //console.log('retrying token');
                    token_retried = true;
                    $.get_token(cart_update_shipping_method);
                }
                else {
		        	$.display_page_fatal_error('cart-detail-body');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('cart-detail-body');
	           	break;
	    }	        
        });
};
cart_update_shipping_method_callback = function( data, textStatus, xhr ) {
    //console.log(data);
    //console.log('cart_update_shipping_method_callback called');

    if (data['cart_update_shipping_method'] == 'success') {
        reload_cart_totals();
    }
    else {
        //console.log('cart_update_shipping_method_callback error');
        var errors = [];
        if (data['errors']['error'] == 'error-setting-cart-shipping-method') {
            errors.push({'type': 'cart-shipping-method-not-found','description': 'There was an error updating your shipping method.'});
            $.log_client_event('ajaxerror', 'cart-update-shipping-method-error-setting-cart-shipping-method');
        }
        else if (data['errors']['error'] == 'shipping-method-required') {
            errors.push({'type': 'shipping-method-required','description': 'Shipping method identifier is required.'});
            $.log_client_event('ajaxerror', 'cart-update-shipping-method-shipping-method-required');
        }
        else if (data['errors']['error'] == 'cart-not-found') {
            errors.push({'type': 'cart-not-found','description': 'There was an error processing your request.'});
            $.log_client_event('ajaxerror', 'cart-update-shipping-method-cart-not-found');
        }
        $.display_errors(errors, $('#shipping-method-error'), $(data['shipping_method_identifier']), 'shipping-method-error-', true);
    }
};

update_cart_item_quantity = function () {
    //console.log('update_cart_item_quantity called');
    cart_item_quantity = 0;
    $('.cart-qty-text-box').each(function(i, obj) {
        cart_item_quantity += parseInt($(obj).val());
    });
};

update_cart_contains_backordered_out_of_stock_item = function () {
    //console.log('update_cart_contains_backordered_out_of_stock_item called');
    cart_contains_backordered_out_of_stock_item = false;
    $('span[sku_inventory_status]').each(function(i, obj) {
        //console.log($(obj).attr('sku_inventory_status'));
        if ($(obj).attr('sku_inventory_status') != 'in-stock') {
            cart_contains_backordered_out_of_stock_item = true;
            return false;
        }
    });
};

cart_check_for_valid_checkout_conditions = function () {
    //console.log('cart_check_for_valid_checkout_conditions called');
    //console.log('cart_item_count is ' + cart_item_count);
    //console.log('cart_item_quantity is ' + cart_item_quantity);
    //console.log('cart_contains_backordered_out_of_stock_item is ' + cart_contains_backordered_out_of_stock_item);
    if (cart_item_count <= 0 || cart_item_quantity <= 0 || cart_contains_backordered_out_of_stock_item == true) {
        $('#cart-checkout-button-wrapper-top').addClass('hide');
        $('#cart-checkout-button-wrapper-bottom').addClass('hide');
        if (cart_contains_backordered_out_of_stock_item == true) {
            $('#cart-detial-general-notification').html('Please remove the Back Ordered or Out of Stock item(s) from your cart to proceed with checkout.');
        }
    }
    else {
        $('#cart-checkout-button-wrapper-top').removeClass('hide');
        $('#cart-checkout-button-wrapper-bottom').removeClass('hide');
        $('#cart-detial-general-notification').html('');
    }

    if (cart_item_count == 0) {
        //console.log('delete cart becasue its empty');
        show_empty_cart();
        cart_delete_cart();
    }
};

cart_delete_cart = function(event) {

    var json_data = {};

    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/order/cart-delete-cart',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: cart_delete_cart_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
	    }
    })
        .fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
            $.log_client_event('ajaxerror', 'cart-delete-cart');
            switch (xhr.status) {
	        case 403:
	           // handle unauthorized
                if (token_retried == false) {
                    //console.log('retrying token');
                    token_retried = true;
                    $.get_token(cart_delete_cart);
                }
                else {
		        	$.display_page_fatal_error('cart-detail-body');
		           	break;
		    	}
	        	break;
	        default:
	        	$.display_page_fatal_error('cart-detail-body');
	           	break;
	    }	        
        });
};
cart_delete_cart_callback = function( data, textStatus, xhr ) {
    //console.log(data);
    //console.log('cart_update_shipping_method_callback called');

    if (data['cart_delete_cart'] == 'success') {
        //console.log('cart_delete_cart_callback success');
    }
    else {
        //console.log('cart_delete_cart_callback error');
        var errors = [];
        if (data['errors']['error'] == 'cart-not-found') {
            errors.push({'type': 'cart-not-found','description': 'There was an error processing your request.'});
            $.log_client_event('ajaxerror', 'cart-delete-cart-cart-not-found');
        }
    }
};


show_empty_cart = function() {
    $('#cart-checkout-button-wrapper-top').remove();
    $('#item-information-sub-header').remove();
    $('#item-information-detail-wrapper').remove();
    $('#shipping-cost-sub-header').remove();
    $('#shipping-information').remove();
    $('#cart-total-sub-header').remove();
    $('#cart-total-detail-wrapper').remove();
    $('#cart-checkout-button-wrapper-bottom').remove();

    $('#cart-detail-body').removeClass('hide');

    $('#cart-detail-body').append('<div id="cart-empty-sub-header" class="cart-sub-header">SHOPPING CART IS EMPTY</div>' + 
									  '<div id="cart-empty-detail-wrapper" class="account-section-details cart-empty-links">Please browse <a href="/products" title="Browse Products">Products</a> to continue shopping.</div></div>');

};
