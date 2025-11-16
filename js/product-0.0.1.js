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

$(document).ready(function() {
    product_identifier = $.urlParam('id');
    if (product_identifier == null) {
        $.load_error('product_identifier_is_null');
    }
    else {
        //console.log(product_identifier);
        var validpattern = new RegExp('^[a-zA-Z0-9]{10}$');
        if (product_identifier.match(validpattern)) {
            var url_str = env_vars['api_url'] + '/order/product/' + product_identifier;
            $.ajax({
                method: 'GET',
                url: url_str,
                dataType: 'json',
			    xhrFields: {
			        withCredentials: true
			    },
		        success: load_product
            })
                .fail(function() {
			    //console.log('get account_content failed');
                    $.log_client_event('ajaxerror', 'product-failed-to-load');
                    $.display_page_fatal_error('product-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
                });


        }
        else {
            $.log_client_event('ajaxerror', 'product-identifier-failed-validation-pattern', true);
            $.display_page_fatal_error('product-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. Your request must include a valid product identifier. The value provided failed validation.</div>');
        }
    }

    set_up_product_form_listeners();
});

set_up_product_form_listeners = function () {
    $('#product-sku-inventory-status').unbind('click');
    $('#product-sku-inventory-status').click(show_hide_inventory_status_help);
    $('#product-add-to-cart').unbind('click');
    $('#product-add-to-cart').click(product_add_to_cart);
    $.bind_key_to_form_submit_button(sku_qty_field, 'enterKey', $('#product-add-to-cart'), 13);
};

load_product = function( data, textStatus, xhr ) {
    //console.log('load_product called');
    //console.log(data);

    referrer = $.urlParam('referrer');

    switch(referrer) {
	    case 'cart':
	    	//console.log($.urlParam('order_id'));
        $('#product-sudo-breadcrumb').append('<a href="/cart">&larr; Return to View Your Shopping Cart</a>');
	        break;
	    case 'order':
	    	//console.log($.urlParam('order_id'));
        $('#product-sudo-breadcrumb').append('<a href="/account/order?identifier=' + $.urlParam('order_identifier') + '">&larr; Return to View Your Order</a>');
	        break;
	    default:
        $('#product-sudo-breadcrumb').append('<a href="/products">&larr; Return to Browse Products</a>');
	        break;
    }		

    var title = data['product_data']['title'];
    var headline = data['product_data']['headline'];
    var description_part_1 = data['product_data']['description_part_1'];
    var description_part_2 = data['product_data']['description_part_2'];
    skus_raw_data = data['product_data']['skus'];

    first_sku_key = Object.keys(skus_raw_data)[0];
    var default_sku = skus_raw_data[first_sku_key];
    var price_formatted = '$' + default_sku['price'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			

    document.title = title;
    $('#product-page-title').html(title);
    $('#product-sku-price').html(price_formatted + ' EACH');
    $('#product-sku-inventory-status').html(default_sku['inventory_status_title']);
    $('#product-sku-inventory-status-help').html(default_sku['inventory_status_description']);
    $('#product-headline').html(headline);
    $('#product-description-1').html(description_part_1);
    $('#product-description-2').html(description_part_2);

    if (skus_raw_data[first_sku_key]['inventory_status_identifier'] != 'in-stock') {
        $('#product-add-to-cart').addClass('product-add-to-cart-disabled');
        // remove click event 
        $('#product-add-to-cart').unbind('click');
    }

    var sku_count = parseInt(Object.keys(skus_raw_data).length);
    //console.log('sku_count is ' + sku_count);
    if (sku_count < 2) {
        $('#product-sku-selector').remove();
    }
    else {
        var product_size_str = '';
        var product_color_str = '';
        for (var sku_id in skus_raw_data) {			
            var sku_description_str = '';
            if (skus_raw_data[sku_id]['color'] != null) {
                product_color_str = 'COLOR';
                sku_description_str = skus_raw_data[sku_id]['color'];
            }
            if (skus_raw_data[sku_id]['size'] != null) {
                product_size_str = 'SIZE';
                if (sku_description_str == '') {
                    sku_description_str = skus_raw_data[sku_id]['size'];					
                }
                else {
                    sku_description_str += ', ' + skus_raw_data[sku_id]['size'];					
                }
            }
            if (sku_description_str == '') {
                sku_description_str = skus_raw_data[sku_id]['description'];
            }
            else {
                if (skus_raw_data[sku_id]['description'] != null) {
                    sku_description_str = skus_raw_data[sku_id]['description'] + ': ' + sku_description_str;
                }
            }
            var checked_str = '';
            if (first_sku_key == sku_id) {
                var checked_str = ' checked="checked"';
            }

            var price_formatted = '$' + skus_raw_data[sku_id]['price'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            sku_description_str += ', ' + price_formatted + ' <span class="product-sku-selector-radio-group-description-note">[' + skus_raw_data[sku_id]['inventory_status_title'] + ']</span>';
            $('#product-sku-selector-radio-group').append('<div class="product-sku-selector-radio-group-item"><div class="product-sku-selector-radio-group-option"><input type="radio" name="sku_selection" value="' + sku_id + '"'+ checked_str + '/></div><div id="product-sku-selector-radio-group-description-' + sku_id + '" sku_id="' + sku_id + '" class="product-sku-selector-radio-group-description">' + sku_description_str + '</div></div>');
            $('input:radio[name=sku_selection][value="' + sku_id + '"]').change(sku_radio_item_clicked);
            $('#product-sku-selector-radio-group-description-' + sku_id).unbind('click');
            $('#product-sku-selector-radio-group-description-' + sku_id).click(sku_radio_description_clicked);
        }
        var sku_selection_label_str = 'SELECT OPTIONS';
        if (product_color_str == '' && product_size_str == '') {
            var sku_selection_label_str = 'SELECT OPTIONS';
        }
        else if (product_color_str != '' && product_size_str == '') {
            var sku_selection_label_str = 'SELECT COLOR';
        }
        else if (product_color_str == '' && product_size_str != '') {
            var sku_selection_label_str = 'SELECT SIZE';
        }
        else {
            var sku_selection_label_str = 'SELECT SIZE & COLOR';
        }
        $('#product-sku-selection-label').html(sku_selection_label_str);
    }

    images_dict['product'] = {};
    images_dict['sku'] = {};
    images_dict['video'] = {};
    var product_images_raw_data = data['product_data']['product_images'];
    for (var product_image_id in product_images_raw_data) {
        var image_dict = {};
        image_dict['url'] = product_images_raw_data[product_image_id]['image_url'];
        image_dict['main'] = product_images_raw_data[product_image_id]['main'];
        image_dict['type'] = 'product';
        image_dict['parent_id'] = null;
        image_dict['caption'] = product_images_raw_data[product_image_id]['caption'];
        images_dict['product'][product_image_id] = image_dict;
    }

    var product_videos_raw_data = data['product_data']['product_videos'];
    for (var product_video_id in product_videos_raw_data) {
        var video_dict = {};
        video_dict['url'] = product_videos_raw_data[product_video_id]['video_url'];
        video_dict['thumbnail_url'] = product_videos_raw_data[product_video_id]['video_thumbnail_url'];
        video_dict['type'] = 'product';
        video_dict['parent_id'] = null;
        video_dict['caption'] = product_videos_raw_data[product_video_id]['caption'];
        images_dict['video'][product_video_id] = video_dict;
    }

    for (var sku_id in skus_raw_data) {

        var sku_images_raw_data = skus_raw_data[sku_id]['sku_images'];
        for (var sku_image_id in sku_images_raw_data) {
            var image_dict = {};
            image_dict['url'] = sku_images_raw_data[sku_image_id]['image_url'];
            image_dict['main'] = sku_images_raw_data[sku_image_id]['main'];
            image_dict['type'] = 'sku';
            image_dict['parent_id'] = sku_id;
            image_dict['caption'] = sku_images_raw_data[sku_image_id]['caption'];
            images_dict['sku'][sku_image_id] = image_dict;
        }
    }
    //console.log(images_dict);

    var image_count = parseInt(0);
    image_count += parseInt(Object.keys(images_dict['product']).length);
    image_count += parseInt(Object.keys(images_dict['sku']).length);
    image_count += parseInt(Object.keys(images_dict['video']).length);

    for (var image_id in images_dict['product']) {
        var selected_border_class = '';
        if (images_dict['product'][image_id]['main'] == true) {
            $('#product-image-wrapper').prepend('<img id="product-image-displayed" class="product-image" src="' + images_dict['product'][image_id]['url'] + '" alt="' + images_dict['product'][image_id]['caption'] + '"/>');
            $('#product-image-caption').html(images_dict['product'][image_id]['caption']);
            selected_border_class = ' product-image-thumbnail-selected';
        }
        if (image_count >= 2) {
            $('#product-image-thumbnails-wrapper').append('<div id="product-image-thumbnail-wrapper-product-' + image_id + '" image_id="' + image_id + '" type="product" class="product-image-thumbnail-wrapper"><img alt="' + images_dict['product'][image_id]['caption'] + '" title="' + images_dict['product'][image_id]['caption'] + '" src="' + images_dict['product'][image_id]['url'] + '" class="product-image-thumbnail' + selected_border_class + '"/></div>');
            $('#product-image-thumbnail-wrapper-product-' + image_id).unbind('click');
            $('#product-image-thumbnail-wrapper-product-' + image_id).click(change_displayed_image);
        }
    }
    for (var image_id in images_dict['sku']) {
        if (image_count >= 2) {
            $('#product-image-thumbnails-wrapper').append('<div id="product-image-thumbnail-wrapper-sku-' + image_id + '" image_id="' + image_id + '" type="sku" parent_sku_id="' + images_dict['sku'][image_id]['parent_id'] + '" class="product-image-thumbnail-wrapper"><img alt="' + images_dict['sku'][image_id]['caption'] + '" title="' + images_dict['sku'][image_id]['caption'] + '" src="' + images_dict['sku'][image_id]['url'] + '" class="product-image-thumbnail"/></div>');
            $('#product-image-thumbnail-wrapper-sku-' + image_id).unbind('click');
            $('#product-image-thumbnail-wrapper-sku-' + image_id).click(change_displayed_image);
        }
    }
    for (var image_id in images_dict['video']) {
        if (image_count >= 2) {
            $('#product-image-thumbnails-wrapper').append('<div id="product-image-thumbnail-wrapper-video-' + image_id + '" image_id="' + image_id + '" type="video" class="product-image-thumbnail-wrapper"><img alt="' + images_dict['video'][image_id]['caption'] + '" title="' + images_dict['video'][image_id]['caption'] + '" src="' + images_dict['video'][image_id]['thumbnail_url'] + '" class="product-image-thumbnail"/></div>');
            $('#product-image-thumbnail-wrapper-video-' + image_id).unbind('click');
            $('#product-image-thumbnail-wrapper-video-' + image_id).click(change_displayed_image);
        }
    }

    $('#product-image-displayed').unbind('click');
    $('#product-image-displayed').click(show_image_modal);

    $.get_token();
};

sku_radio_description_clicked = function(event) {
    //console.log('sku_radio_description_selected called');
    var selected_sku_id = $(event.target).attr('sku_id');
    $('input[name=sku_selection][value="' + selected_sku_id + '"]').prop( 'checked', true );
    sku_radio_item_changed(selected_sku_id);
};

sku_radio_item_clicked = function(event) {
    //console.log('sku_radio_item_clicked called');
    var selected_sku_id = $(event.target).val();
    sku_radio_item_changed(selected_sku_id);
};

sku_radio_item_changed = function(selected_sku_id) {
    //console.log('sku_radio_item_changed called');
    //var selected_sku_id = $(event.target).val();
    //console.log('selected_sku_id is ' + selected_sku_id);
    for (var sku_id in skus_raw_data) {
        if (selected_sku_id == sku_id) {
            var price_formatted = '$' + skus_raw_data[sku_id]['price'].toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');			
            $('#product-sku-price').html(price_formatted + ' EACH');
            $('#product-sku-inventory-status').html(skus_raw_data[sku_id]['inventory_status_title']);
            $('#product-sku-inventory-status-help').html(skus_raw_data[sku_id]['inventory_status_description']);
            //console.log(skus_raw_data[sku_id]['inventory_status_identifier']);
            if (skus_raw_data[sku_id]['inventory_status_identifier'] != 'in-stock') {
                $('#product-add-to-cart').addClass('product-add-to-cart-disabled');
                // remove click event 
                $('#product-add-to-cart').unbind('click');
            }
            else {
                $('#product-add-to-cart').removeClass('product-add-to-cart-disabled');
                $('#product-add-to-cart').removeClass('product-added-to-cart');
                $('#product-add-to-cart').html('ADD TO CART');
                // add click event 
                $('#product-add-to-cart').unbind('click');
                $('#product-add-to-cart').click(product_add_to_cart);
            }
            for (var image_counter in images_dict['sku']) {
                if (images_dict['sku'][image_counter]['parent_id'] == sku_id && images_dict['sku'][image_counter]['main'] == true) {
                    $('#product-image-displayed').attr('src', images_dict['sku'][image_counter]['url']);
                    $('.product-image-thumbnail-selected').removeClass('product-image-thumbnail-selected');
                    $('div[parent_sku_id=' + sku_id + ']').children().first().addClass('product-image-thumbnail-selected');	
                }
            }
        }	
    }
};

show_image_modal = function(event) {
    var product_image_modal_display = '<div class="product-full-screen-modal">' + 
												'<div id="product_image_modal_display" class="product-full-screen-modal-content">' +
													'<div id="product-full-screen-modal-image" class="product-full-screen-modal-image-wrapper"><img alt="" title="" src="' + $(event.currentTarget).attr('src') + '" class="product-full-screen-modal-image"/></div>' + 
													'<div id="product-full-screen-modal-caption" class="product-full-screen-modal-caption">' + $('#product-image-caption').html() + '</div>' + 
												'</div>' +
											 '</div>';
    var product_image_modal_display_div = $(product_image_modal_display).appendTo('body');
    product_image_modal_display_div.unbind('click');
    product_image_modal_display_div.click(hide_image_modal);
};

hide_image_modal = function() {
    $('.product-full-screen-modal').remove();
};

change_displayed_image = function (event) {
    //console.log('change_displayed_image called');
    $('.product-image-thumbnail-selected').removeClass('product-image-thumbnail-selected');
    $(event.currentTarget).children().first().addClass('product-image-thumbnail-selected');	

    if ($(event.currentTarget).attr('type') == 'video') {
        $('#product-image-displayed').remove();
        $('#product-image-wrapper').prepend('<iframe id="product-image-displayed" src="' + images_dict[$(event.currentTarget).attr('type')][$(event.currentTarget).attr('image_id')]['url'] + '" width="320" height="180" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
    }
    else {
        $('#product-image-displayed').remove();
        $('#product-image-wrapper').prepend('<img id="product-image-displayed" class="product-image" src="' + images_dict[$(event.currentTarget).attr('type')][$(event.currentTarget).attr('image_id')]['url'] + '" alt="' + images_dict[$(event.currentTarget).attr('type')][$(event.currentTarget).attr('image_id')]['caption'] + '"/>');
        $('#product-image-displayed').unbind('click');
        $('#product-image-displayed').click(show_image_modal);
    }
    $('#product-image-caption').html(images_dict[$(event.currentTarget).attr('type')][$(event.currentTarget).attr('image_id')]['caption']);


};

show_hide_inventory_status_help = function () {
    //console.log('show_hide_inventory_status_help called');
    if ($('#product-sku-inventory-status-help').hasClass('hide')) {
        $('#product-sku-inventory-status-help').removeClass('hide');
    }
    else {
        $('#product-sku-inventory-status-help').addClass('hide');
    }
};

product_add_to_cart = function () {
    //console.log('sku_add_to_cart called');
    var selected_sku_id = $('input[name=sku_selection]:checked').val();
    if (selected_sku_id == null) {
        console.log(first_sku_key);
        selected_sku_id = first_sku_key;
    }
    //console.log('selected_sku_id is ' + selected_sku_id);
    var json_data = {'sku_id':selected_sku_id,
					 'quantity':$('#sku_qty').val()
    };
    //console.log(json_data);

    $.ajax({
        method: 'POST',
        url: env_vars['api_url'] + '/order/cart-add-product-sku',
        dataType: 'json',
	    xhrFields: {
	        withCredentials: true
	    },
	    data: json_data,
        success: product_add_to_cart_callback,
        beforeSend: function(request) {
		    //console.log('in beforeSend');
		    request.setRequestHeader('X-CSRFToken', $.getCookie('csrftoken'));
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
};
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
};
success_product_add_to_cart = function(data, textStatus, xhr) {
    $('#product-add-to-cart').addClass('product-added-to-cart');
    $('#product-add-to-cart').html('ITEM ADDED TO CART');
    $('#product-add-to-cart').unbind('click');
    $.set_cart_item_counter(data['cart_item_count']);
};
error_product_add_to_cart = function() {
    $('#product-add-to-cart').html('ERROR ADDING ITEM TO CART');
    $('#product-add-to-cart').unbind('click');
};
