// other global variables 
var csrftoken;
var token_retried = false;
var env_vars = $.env_vars();
var product_identifier = null;
var referrer = null;
var images_dict = {};
var skus_raw_data = null;
var first_sku_key = null;
var sku_qty_field = $('#sku_qty');
var product_identifier = 'bYK0gVlIto';
var sku_id = null;

$(document).ready(function() {
	var url_str = env_vars['api_url'] + "/order/product/" + product_identifier;
	$.ajax({
		method: "GET",
		url: url_str,
		dataType: "json",
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_product
	})
	.fail(function() {
	    //console.log('get account_content failed');
		$.log_client_event('ajaxerror', 'preschooler-snack-pack-product-failed-to-load');
		$.display_page_fatal_error('product-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
	});


	set_up_product_form_listeners();
});

set_up_product_form_listeners = function () {
	$('#product-add-to-cart-1').unbind('click');
	$('#product-add-to-cart-1').click(product_add_to_cart);
	$('#product-add-to-cart-2').unbind('click');
	$('#product-add-to-cart-2').click(product_add_to_cart);
}

load_product = function( data, textStatus, xhr ) {
	//console.log('load_product called');
	//console.log(data);

	skus_raw_data = data['product_data']['skus'];
	sku_id = Object.keys(skus_raw_data)[0];

	$.get_token();
}

show_image_modal = function(event) {
	var product_image_modal_display = '<div class="product-full-screen-modal">' + 
												'<div id="product_image_modal_display" class="product-full-screen-modal-content">' +
													'<div id="product-full-screen-modal-image" class="product-full-screen-modal-image-wrapper"><img alt="" title="" src="' + $(event.currentTarget).attr('src') + '" class="product-full-screen-modal-image"/></div>' + 
													'<div id="product-full-screen-modal-caption" class="product-full-screen-modal-caption">' + $('#product-image-caption').html() + '</div>' + 
												'</div>' +
											 '</div>';
	var product_image_modal_display_div = $(product_image_modal_display).appendTo('body');
	$('#product_image_modal_display').unbind('click');
	$('#product_image_modal_display').click(hide_image_modal);
}

hide_image_modal = function() {
	$('.product-full-screen-modal').remove();
}

product_add_to_cart = function (event) {
	//console.log('sku_add_to_cart called');
	var json_data = {"sku_id":sku_id,
					 "quantity":"1"
	};

	//console.log(json_data);

	if ($(event.currentTarget).attr('id') == 'product-add-to-cart-1') {
		$.log_client_event('buttonclick', 'preschooler-snack-pack-product-add-to-cart-1', false);
	}
	else if ($(event.currentTarget).attr('id') == 'product-add-to-cart-2') {
		$.log_client_event('buttonclick', 'preschooler-snack-pack-product-add-to-cart-2', false);
	}

	$.ajax({
		method: "POST",
		url: env_vars['api_url'] + "/order/cart-add-product-sku",
		dataType: "json",
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
		success: product_add_to_cart_callback,
		beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader("X-CSRFToken", csrftoken);
	    }
	})
	.fail(function(xhr, textStatus, errorThrown) {
	    //console.log('post update-my-information failed');
        //console.log('xhr.status is ' + xhr.status);
		$.log_client_event('ajaxerror', 'product-add-to-cart');
		switch (xhr.status) {
	        case 403:
	           // handle unauthorized
				if (token_retried == false) {
					//console.log('retrying token');
					token_retried = true;
					$.get_token(product_add_to_cart);
				}
				else {
					error_product_add_to_cart();
		           	break;
		    	}
	        	break;
	        default:
				error_product_add_to_cart();
	           	break;
	    }	        
	});	
}
product_add_to_cart_callback = function( data, textStatus, xhr ) {
	//console.log(xhr);
	//console.log(data);
	//console.log('product_add_to_cart_callback called');
	if (data['cart_add_product_sku'] == 'success') {
		success_product_add_to_cart(data, textStatus, xhr);
	}
	else if (data['cart_add_product_sku'] == 'error') {
		if (data['errors']['quantity'] !== undefined && data['errors']['quantity'][0][0]['type'] == 'out_of_range') { 
			error_product_add_to_cart();
			$.log_client_event('ajaxerror', 'add-to-cart-out-of-range');
		}
		if (data['errors']['error'] == 'sku-not-found') { 
			error_product_add_to_cart();
			$.log_client_event('ajaxerror', 'add-to-cart-sku-not-found');
		}
		if (data['errors']['error'] == 'sku-id-required') { 
			error_product_add_to_cart();
			$.log_client_event('ajaxerror', 'add-to-cart-sku-id-required');
		}
	}
	else {
		error_product_add_to_cart();
		$.log_client_event('ajaxerror', 'add-to-cart-product-undefined');
	}
}
success_product_add_to_cart = function(data, textStatus, xhr) {
	$('#product-add-to-cart-1').addClass('product-added-to-cart');
	$('#product-add-to-cart-1').html('ITEM ADDED TO CART');
	$('#product-add-to-cart-1').unbind("click");
	$('#product-add-to-cart-2').addClass('product-added-to-cart');
	$('#product-add-to-cart-2').html('ITEM ADDED TO CART');
	$('#product-add-to-cart-2').unbind("click");
	$.set_cart_item_counter(data['cart_item_count']);
}
error_product_add_to_cart = function() {
	$('#product-add-to-cart-1').html('ERROR ADDING ITEM TO CART');
	$('#product-add-to-cart-1').unbind("click");
	$('#product-add-to-cart-2').html('ERROR ADDING ITEM TO CART');
	$('#product-add-to-cart-2').unbind("click");
}
