// other global variables 
var env_vars = $.env_vars();

$(document).ready(function() {
	$.ajax({
		method: "GET",
		url: env_vars['api_url'] + "/order/products",
		dataType: "json",
	    xhrFields: {
	        withCredentials: true
	    },
        success: load_products
	})
	.fail(function() {
		//console.log('get account_content failed');
		$.log_client_event('ajaxerror', 'products');
		$.display_page_fatal_error('products-detail-body', '<div id="account-info" class="account-section-details">We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.</div>');
	});
});

load_products = function( data, textStatus, xhr ) {
	//console.log('load_products called');
	//console.log(data);

	for (var product_identifier in data['products_data']) {
		var title = data['products_data'][product_identifier]['title'];
		var title_url = data['products_data'][product_identifier]['title_url'];
		var identifier = data['products_data'][product_identifier]['identifier'];
		var headline = data['products_data'][product_identifier]['headline'];
		var description_part_1 = data['products_data'][product_identifier]['description_part_1'];
		var description_part_2 = data['products_data'][product_identifier]['description_part_2'];
		var product_image_url = data['products_data'][product_identifier]['product_image_url'];
		var price_low = data['products_data'][product_identifier]['price_low'];
		var price_high = data['products_data'][product_identifier]['price_high'];

		var price_low_formatted = '$' + price_low.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");			
		var price_high_formatted = '$' + price_high.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");			
		if (price_low == price_high) {
			var price_range_str = price_low_formatted;
		}
		else {
			var price_range_str = price_low_formatted + ' - ' + price_high_formatted;
		}

		var products_product_wrapper_str = '<div id="products-product-wrapper-' + identifier + '" class="products-product-wrapper">';
        $("#products-listing-wrapper").append(products_product_wrapper_str);
        var products_product_wrapper_element = $('#products-product-wrapper-' + identifier);
		var product_image_wrapper_str = '<div id="products-product-image-' + identifier + '" class="products-product-image-wrapper"><a href="/product?name=' + title_url + '&id=' + identifier + '"><img id="products-product-image-' + identifier + '" alt="' + title + '" class="products-product-image" src="' + product_image_url + '"/></a></div>';
		var product_detail_wrapper_str = '<div id="products-product-details-wrapper-' + identifier + '" class="products-product-details-wrapper">' +
										  '<div id="products-product-title-' + identifier + '" class="products-product-title products-product-link"><a href="/product?name=' + title_url + '&id=' + identifier + '">' + title + '</a></div>' + 
										  '<div id="products-product-headline-' + identifier + '" class="products-product-headline products-product-link"><a href="/product?name=' + title_url + '&id=' + identifier + '">' + headline + '</a></div>' + 
										  '<div id="products-product-price-' + identifier + '" class="products-product-price products-product-link"><a href="/product?name=' + title_url + '&id=' + identifier + '">' + price_range_str + '</a></div>' + 
										  '<a href="/product?name=' + title_url + '&id=' + identifier + '"><div id="products-product-view-details-' + identifier + '" class="products-product-view-details">View Details</div></a>' + 
									  '</div>';
        products_product_wrapper_element.append(product_image_wrapper_str);
        products_product_wrapper_element.append(product_detail_wrapper_str);
	}
}


