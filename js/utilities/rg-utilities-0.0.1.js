$.get_token = function(callback, identifier, json_data) {
	if(callback === undefined) {callback = null;}
	if(identifier === undefined) {identifier = null;}
	if(json_data === undefined) {json_data = null;}
	$.ajax({
		method: "GET",
		url: env_vars['api_url'] + "/user/token",
		dataType: "json",
	    xhrFields: {
	        withCredentials: true
	    }
	})
	.done(function() {
	    //console.log('get_token succeeded');
		$.load_token(callback, identifier, json_data);
	})
	.fail(function(xhr, textStatus, errorThrown) {
	    //console.log('get token failed');
        //console.log('xhr.status is ' + xhr.status);
		$.log_client_event('ajaxerror', 'token');
		switch (xhr.status) {
	        default: "value", 
	        	$.display_page_fatal_error('gallery-container');
	           	break;
	    }	        
	});
}

$.load_token = function(callback, identifier, json_data) {
	if(callback === undefined) {callback = null;}
	if(identifier === undefined) {identifier = null;}
	if(json_data === undefined) {json_data = null;}
	csrftoken = $.getCookie('csrftoken');
	if (callback != null) {
		//console.log('calling callback' + callback);
		callback(identifier, json_data);
	}
}

$.set_cart_item_counter = function(cart_item_count) {
	$('#cart-item-count-wrapper').remove();
	var cart_item_count_wrapper_str = '';
	if (parseInt(cart_item_count) == 0) {
		cart_item_count_wrapper_str = '<div id="cart-item-count-wrapper" class="cart-item-count-wrapper cart-item-count-wrapper-single-digit" title="You have no items in your cart.">' + cart_item_count + '</div>';
	} 
	else if (parseInt(cart_item_count) == 1) {
		cart_item_count_wrapper_str = '<div id="cart-item-count-wrapper" class="cart-item-count-wrapper cart-item-count-wrapper-single-digit" title="You have ' + cart_item_count + ' item in your cart.">' + cart_item_count + '</div>';
	}
	else if (parseInt(cart_item_count) > 1 && parseInt(cart_item_count) <= 9) {
		cart_item_count_wrapper_str = '<div id="cart-item-count-wrapper" class="cart-item-count-wrapper cart-item-count-wrapper-single-digit" title="You have ' + cart_item_count + ' items in your cart.">' + cart_item_count + '</div>';
	}
	else if (parseInt(cart_item_count) > 9) {
		cart_item_count_wrapper_str = '<div id="cart-item-count-wrapper" class="cart-item-count-wrapper cart-item-count-wrapper-double-digit" title="You have ' + cart_item_count + ' items in your cart.">' + cart_item_count + '</div>';
	}
	$("#header-shopping-cart").append(cart_item_count_wrapper_str);
}
